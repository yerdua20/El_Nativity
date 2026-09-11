import csv
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import (
    Case,
    DecimalField,
    F,
    OuterRef,
    ProtectedError,
    Q,
    Subquery,
    Sum,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.http import HttpResponse, JsonResponse
from django.utils.dateparse import parse_datetime
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import (
    Client,
    Commercial,
    Encaissement,
    Entreprise,
    MouvementStock,
    PointDeVente,
    Produit,
    Reservation,
    StockPointDeVente,
    Tarif,
)
from core.permissions import EstStaffPourEcriture, commercial_de
from core.serializers import (
    ClientSerializer,
    CommercialSerializer,
    EncaissementSerializer,
    EntrepriseSerializer,
    MouvementStockSerializer,
    PointDeVenteSerializer,
    ProduitSerializer,
    ReservationSerializer,
    StockPointDeVenteSerializer,
    TarifSerializer,
    UserAdminSerializer,
)

User = get_user_model()


def sante(request):
    """Vérification simple de disponibilité de l'API."""
    return JsonResponse({"status": "ok"})


def _depuis(request):
    """Parse le paramètre ?depuis=<datetime ISO> utilisé pour la synchronisation incrémentale."""
    valeur = request.query_params.get("depuis")
    return parse_datetime(valeur) if valeur else None


def _filtrer_par_client(qs, request):
    """Applique le paramètre ?client=<id>, utilisé par la fiche client."""
    client_id = request.query_params.get("client")
    return qs.filter(client_id=client_id) if client_id else qs


def _infos_utilisateur(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_staff": user.is_staff,
    }


class MoiView(APIView):
    """Infos du compte connecté (pour l'écran Profil)."""

    def get(self, request):
        return Response(_infos_utilisateur(request.user))

    def patch(self, request):
        email = request.data.get("email")
        if email is not None:
            request.user.email = email
            request.user.save(update_fields=["email"])
        return Response(_infos_utilisateur(request.user))


class ChangerMotDePasseView(APIView):
    """Permet à l'utilisateur connecté de changer son propre mot de passe."""

    def post(self, request):
        ancien = request.data.get("ancien_mot_de_passe", "")
        nouveau = request.data.get("nouveau_mot_de_passe", "")
        user = request.user

        if not user.check_password(ancien):
            return Response({"detail": "Mot de passe actuel incorrect."}, status=400)

        try:
            validate_password(nouveau, user=user)
        except DjangoValidationError as exc:
            return Response({"detail": list(exc.messages)}, status=400)

        user.set_password(nouveau)
        user.save(update_fields=["password"])
        return Response({"detail": "Mot de passe modifié."})


class EntrepriseView(APIView):
    """
    Réglages globaux (onglets Général + Sécurité de Paramètres).
    Lecture pour tout utilisateur connecté, écriture réservée au staff.
    """

    permission_classes = [IsAuthenticated, EstStaffPourEcriture]

    def get(self, request):
        return Response(EntrepriseSerializer(Entreprise.charger()).data)

    def patch(self, request):
        entreprise = Entreprise.charger()
        serializer = EntrepriseSerializer(entreprise, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserAdminViewSet(viewsets.ModelViewSet):
    """Gestion des comptes utilisateurs (onglet Utilisateurs), reservee au staff."""

    queryset = User.objects.all().order_by("username")
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Impossible de supprimer : des enregistrements sont liés à cet utilisateur."},
                status=400,
            )


_JEUX_EXPORT = {
    "clients": (
        ["Nom", "Mode", "Téléphone", "Adresse", "Commercial", "Solde marchandise", "Solde financier", "Actif"],
        lambda: (
            [
                c.nom,
                c.get_mode_vente_display(),
                c.telephone,
                c.adresse,
                str(c.commercial) if c.commercial else "",
                c.solde_marchandise,
                c.solde_financier,
                c.actif,
            ]
            for c in Client.objects.select_related("commercial")
        ),
    ),
    "commerciaux": (
        ["Nom", "Prénom", "Téléphone", "Point de vente", "Actif"],
        lambda: (
            [c.nom, c.prenom, c.telephone, str(c.point_de_vente), c.actif]
            for c in Commercial.objects.select_related("point_de_vente")
        ),
    ),
    "mouvements": (
        ["Date", "Type", "Produit", "Quantité", "Montant", "Client", "Commercial", "Point de vente"],
        lambda: (
            [
                m.date_mouvement,
                m.get_type_display(),
                m.produit.nom,
                m.quantite,
                m.montant,
                str(m.client or ""),
                str(m.commercial or ""),
                str(m.point_de_vente or ""),
            ]
            for m in MouvementStock.objects.select_related("produit", "client", "commercial", "point_de_vente")
        ),
    ),
    "encaissements": (
        ["Date", "Client", "Montant", "Moyen de paiement", "Collecté par"],
        lambda: (
            [e.date_encaissement, str(e.client), e.montant, e.get_moyen_paiement_display(), str(e.collecte_par or "")]
            for e in Encaissement.objects.select_related("client", "collecte_par")
        ),
    ),
}


class ExportCSVView(APIView):
    """Export CSV des données (onglet Données), réservé au staff."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        jeu = request.query_params.get("jeu", "clients")
        if jeu not in _JEUX_EXPORT:
            return Response(
                {"detail": f"Jeu de données inconnu. Valeurs possibles : {', '.join(_JEUX_EXPORT)}."},
                status=400,
            )

        entetes, lignes = _JEUX_EXPORT[jeu]
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{jeu}.csv"'
        writer = csv.writer(response)
        writer.writerow(entetes)
        writer.writerows(lignes())
        return response


class PointDeVenteViewSet(viewsets.ModelViewSet):
    queryset = PointDeVente.objects.all()
    serializer_class = PointDeVenteSerializer
    permission_classes = [IsAuthenticated, EstStaffPourEcriture]


class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated, EstStaffPourEcriture]


class TarifViewSet(viewsets.ModelViewSet):
    queryset = Tarif.objects.all()
    serializer_class = TarifSerializer
    permission_classes = [IsAuthenticated, EstStaffPourEcriture]


class CommercialViewSet(viewsets.ModelViewSet):
    serializer_class = CommercialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Commercial.objects.all()
        if self.request.user.is_staff:
            return qs
        proprietaire = commercial_de(self.request)
        return qs.filter(pk=proprietaire.pk) if proprietaire else qs.none()


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Client.objects.all()
        if self.request.user.is_staff:
            return qs
        proprietaire = commercial_de(self.request)
        return qs.filter(commercial=proprietaire) if proprietaire else qs.none()

    @action(detail=True, methods=["get"])
    def stock(self, request, pk=None):
        """
        Détail par produit de la marchandise encore détenue par ce
        client (solde_marchandise n'est qu'une valeur globale en
        FCFA) : déposé - vendu déclaré - retourné, par produit.
        """
        client = self.get_object()
        effets = {
            MouvementStock.TypeMouvement.DEPOT_CLIENT: 1,
            MouvementStock.TypeMouvement.VENTE_DECLAREE: -1,
            MouvementStock.TypeMouvement.RETOUR_CLIENT: -1,
        }
        lignes = (
            MouvementStock.objects.filter(client=client, type__in=effets)
            .annotate(
                effet=Case(
                    *[When(type=type_, then=Value(mult)) for type_, mult in effets.items()],
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                )
            )
            .values("produit", produit_nom=F("produit__nom"))
            .annotate(quantite_restante=Sum(F("quantite") * F("effet")))
            .filter(quantite_restante__gt=0)
            .order_by("produit__nom")
        )
        return Response(list(lignes))


class MouvementStockViewSet(viewsets.ModelViewSet):
    serializer_class = MouvementStockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = MouvementStock.objects.all()
        if not self.request.user.is_staff:
            proprietaire = commercial_de(self.request)
            if not proprietaire:
                return qs.none()
            qs = qs.filter(Q(commercial=proprietaire) | Q(client__commercial=proprietaire))
        qs = _filtrer_par_client(qs, self.request)
        depuis = _depuis(self.request)
        if depuis:
            qs = qs.filter(created_at__gt=depuis)
        return qs


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related("point_de_vente").all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated, EstStaffPourEcriture]


class StockPointDeVenteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Lecture seule : le stock n'est jamais modifié directement, seulement via les mouvements."""

    queryset = StockPointDeVente.objects.select_related("point_de_vente", "produit").all()
    serializer_class = StockPointDeVenteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        point_de_vente_id = self.request.query_params.get("point_de_vente")
        if point_de_vente_id:
            qs = qs.filter(point_de_vente_id=point_de_vente_id)

        vendu = (
            MouvementStock.objects.filter(
                point_de_vente=OuterRef("point_de_vente"),
                produit=OuterRef("produit"),
                type=MouvementStock.TypeMouvement.VENTE_DIRECTE,
            )
            .values("point_de_vente", "produit")
            .annotate(total=Sum("quantite"))
            .values("total")
        )
        qs = qs.annotate(
            quantite_vendue=Coalesce(
                Subquery(vendu, output_field=DecimalField(max_digits=12, decimal_places=2)),
                Value(Decimal("0")),
            )
        )
        return qs


class EncaissementViewSet(viewsets.ModelViewSet):
    serializer_class = EncaissementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Encaissement.objects.all()
        if not self.request.user.is_staff:
            proprietaire = commercial_de(self.request)
            if not proprietaire:
                return qs.none()
            qs = qs.filter(Q(collecte_par=proprietaire) | Q(client__commercial=proprietaire))
        qs = _filtrer_par_client(qs, self.request)
        depuis = _depuis(self.request)
        if depuis:
            qs = qs.filter(created_at__gt=depuis)
        return qs
