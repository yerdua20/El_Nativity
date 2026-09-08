from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from core.models import (
    Client,
    Commercial,
    Encaissement,
    MouvementStock,
    PointDeVente,
    Produit,
    Tarif,
)
from core.permissions import EstStaffPourEcriture, commercial_de
from core.serializers import (
    ClientSerializer,
    CommercialSerializer,
    EncaissementSerializer,
    MouvementStockSerializer,
    PointDeVenteSerializer,
    ProduitSerializer,
    TarifSerializer,
)


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
