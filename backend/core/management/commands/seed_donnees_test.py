import uuid
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from core.models import (
    Client,
    Commercial,
    Encaissement,
    MouvementStock,
    PointDeVente,
    Produit,
    Reservation,
    StockPointDeVente,
    Tarif,
)
from core.services import enregistrer_encaissement, enregistrer_mouvement_stock

NOMS_POINTS_DE_VENTE = ["Dépôt Central Lomé", "Bar La Nativité - Agoè", "Restaurant La Nativité"]
REFERENCES_PRODUITS = ["BIERE-AWO-CASIER", "SODA-COCA-33", "EAU-MIN-15L", "MENU-POULET", "MENU-POISSON"]
USERNAMES_COMMERCIAUX = ["koffi.amegnran", "afiwa.dogbe"]


class Command(BaseCommand):
    """
    Crée un jeu de données fictif (points de vente, produits, tarifs,
    commerciaux, clients, mouvements, encaissements, stock de bar,
    réservations) pour tester l'application de bout en bout sans
    toucher à de vraies données.

    Refuse de tourner si DEBUG=False, pour ne jamais l'exécuter par
    erreur contre la base de production.
    """

    help = "Crée des données fictives pour les tests (refuse si DEBUG=False)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime d'abord les données précédemment créées par cette commande.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "DEBUG=False : cette commande ne doit tourner qu'en local, pas en production."
            )

        if options["reset"]:
            self._reset()

        with transaction.atomic():
            depot = self._creer_point_de_vente("Dépôt Central Lomé", PointDeVente.TypePointDeVente.DEPOT)
            bar = self._creer_point_de_vente("Bar La Nativité - Agoè", PointDeVente.TypePointDeVente.BAR)
            restaurant = self._creer_point_de_vente(
                "Restaurant La Nativité", PointDeVente.TypePointDeVente.RESTAURANT
            )

            produits = self._creer_produits()
            self._creer_tarifs(produits, [depot, bar, restaurant])

            commercial_koffi = self._creer_commercial(
                depot, "Koffi", "Amégnran", "90 11 22 33", username="koffi.amegnran"
            )
            commercial_afiwa = self._creer_commercial(
                depot, "Afiwa", "Dogbe", "91 44 55 66", username="afiwa.dogbe"
            )

            clients_koffi = [
                self._creer_client(commercial_koffi, "Boutique Bon Prix", "90 12 34 56", "Adidogomé, Lomé"),
                self._creer_client(commercial_koffi, "Alimentation Grâce", "90 65 43 21", "Agbalépédogan, Lomé"),
                self._creer_client(commercial_koffi, "Kiosque Espoir", "90 77 88 99", "Bè, Lomé"),
            ]
            clients_afiwa = [
                self._creer_client(commercial_afiwa, "Supérette Aïda", "91 22 33 44", "Tokoin, Lomé"),
                self._creer_client(commercial_afiwa, "Dépôt Faveur", "91 55 66 77", "Hédzranawoé, Lomé"),
            ]

            maintenant = timezone.now()

            # Affectation initiale de marchandise aux commerciaux.
            self._affecter(commercial_koffi, produits["biere"], Decimal("20"), maintenant - timedelta(days=10))
            self._affecter(commercial_koffi, produits["soda"], Decimal("15"), maintenant - timedelta(days=10))
            self._affecter(commercial_afiwa, produits["eau"], Decimal("30"), maintenant - timedelta(days=8))
            self._affecter(commercial_afiwa, produits["biere"], Decimal("10"), maintenant - timedelta(days=8))

            # Dépôts chez les clients.
            self._deposer(commercial_koffi, clients_koffi[0], produits["biere"], Decimal("8"), maintenant - timedelta(days=9))
            self._deposer(commercial_koffi, clients_koffi[1], produits["soda"], Decimal("6"), maintenant - timedelta(days=9))
            self._deposer(commercial_koffi, clients_koffi[2], produits["biere"], Decimal("5"), maintenant - timedelta(days=7))
            self._deposer(commercial_afiwa, clients_afiwa[0], produits["eau"], Decimal("12"), maintenant - timedelta(days=7))
            self._deposer(commercial_afiwa, clients_afiwa[1], produits["biere"], Decimal("6"), maintenant - timedelta(days=6))

            # Ventes déclarées par certains clients (bascule marchandise -> financier).
            self._vendre(clients_koffi[0], produits["biere"], Decimal("5"), maintenant - timedelta(days=4))
            self._vendre(clients_koffi[1], produits["soda"], Decimal("6"), maintenant - timedelta(days=3))
            self._vendre(clients_afiwa[0], produits["eau"], Decimal("9"), maintenant - timedelta(days=2))

            # Un retour client vers le commercial.
            self._retourner(clients_koffi[2], commercial_koffi, produits["biere"], Decimal("2"), maintenant - timedelta(days=1))

            # Encaissements (règlements partiels).
            self._encaisser(clients_koffi[0], Decimal("2500"), commercial_koffi, maintenant - timedelta(days=1))
            self._encaisser(clients_afiwa[0], Decimal("1500"), commercial_afiwa, maintenant)

            # Réception de stock au bar et au restaurant.
            self._recevoir(bar, produits["biere"], Decimal("50"), maintenant - timedelta(days=5))
            self._recevoir(bar, produits["soda"], Decimal("40"), maintenant - timedelta(days=5))
            self._recevoir(restaurant, produits["menu_poulet"], Decimal("20"), maintenant - timedelta(days=5))
            self._recevoir(restaurant, produits["menu_poisson"], Decimal("20"), maintenant - timedelta(days=5))

            # Ventes directes passées, pour tester le "vendu (total)" cumulé.
            self._vendre_directement(bar, produits["biere"], Decimal("10"), maintenant - timedelta(days=3))
            self._vendre_directement(bar, produits["soda"], Decimal("5"), maintenant - timedelta(days=2))

            # Ventes directes du jour, pour tester le résumé "Ventes directes aujourd'hui".
            self._vendre_directement(bar, produits["biere"], Decimal("3"), maintenant)
            self._vendre_directement(restaurant, produits["menu_poulet"], Decimal("4"), maintenant)
            self._vendre_directement(restaurant, produits["menu_poisson"], Decimal("2"), maintenant)

            # Réservations de places de fête.
            self._reserver(bar, "Kodjo Mensah", "90 99 88 77", "Anniversaire", 8, maintenant + timedelta(days=2))
            self._reserver(restaurant, "Ama Sena", "91 22 11 00", "Mariage", 25, maintenant + timedelta(days=5))
            self._reserver(
                bar, "Client annulé", "90 00 00 00", "", 4, maintenant + timedelta(days=1), statut=Reservation.Statut.ANNULEE
            )
            self._reserver(
                restaurant,
                "Client déjà venu",
                "91 33 22 11",
                "Baptême",
                12,
                maintenant - timedelta(days=1),
                statut=Reservation.Statut.HONOREE,
            )

        self.stdout.write(self.style.SUCCESS("Données fictives créées."))
        self.stdout.write("Comptes commerciaux créés (mot de passe : test1234) :")
        self.stdout.write("  - koffi.amegnran")
        self.stdout.write("  - afiwa.dogbe")

    # -- Création des entités de base ------------------------------------

    def _creer_point_de_vente(self, nom, type_pdv):
        pdv, _ = PointDeVente.objects.get_or_create(nom=nom, defaults={"type_pdv": type_pdv})
        return pdv

    def _creer_produits(self):
        specs = [
            ("biere", "Bière Awooyo (casier)", "BIERE-AWO-CASIER", "casier", Decimal("6000")),
            ("soda", "Coca-Cola 33cl (casier)", "SODA-COCA-33", "casier", Decimal("4500")),
            ("eau", "Eau minérale 1.5L (carton)", "EAU-MIN-15L", "carton", Decimal("2500")),
            ("menu_poulet", "Menu Poulet braisé", "MENU-POULET", "assiette", Decimal("3500")),
            ("menu_poisson", "Menu Poisson grillé", "MENU-POISSON", "assiette", Decimal("4000")),
        ]
        produits = {}
        for cle, nom, reference, unite, _prix in specs:
            produit, _ = Produit.objects.get_or_create(
                reference=reference, defaults={"nom": nom, "unite": unite}
            )
            produits[cle] = produit
        self._prix_par_produit = {cle: prix for cle, _, _, _, prix in specs}
        return produits

    def _creer_tarifs(self, produits, points_de_vente):
        for cle, produit in produits.items():
            for pdv in points_de_vente:
                Tarif.objects.get_or_create(
                    produit=produit,
                    point_de_vente=pdv,
                    date_effet=timezone.localdate() - timedelta(days=30),
                    defaults={"prix": self._prix_par_produit[cle]},
                )

    def _creer_commercial(self, depot, prenom, nom, telephone, username):
        User = get_user_model()
        utilisateur, cree = User.objects.get_or_create(
            username=username, defaults={"first_name": prenom, "last_name": nom}
        )
        if cree:
            utilisateur.set_password("test1234")
            utilisateur.save()

        commercial, _ = Commercial.objects.get_or_create(
            utilisateur=utilisateur,
            defaults={
                "point_de_vente": depot,
                "nom": nom,
                "prenom": prenom,
                "telephone": telephone,
                "date_entree": timezone.localdate() - timedelta(days=60),
            },
        )
        return commercial

    def _creer_client(self, commercial, nom, telephone, adresse):
        client, _ = Client.objects.get_or_create(
            commercial=commercial,
            nom=nom,
            defaults={"telephone": telephone, "adresse": adresse},
        )
        return client

    # -- Mouvements / encaissements ---------------------------------------

    def _affecter(self, commercial, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="AFFECTATION_COMMERCIAL",
            produit=produit,
            quantite=quantite,
            commercial=commercial,
            date_mouvement=date,
            commentaire="Affectation de test",
        )

    def _deposer(self, commercial, client, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="DEPOT_CLIENT",
            produit=produit,
            quantite=quantite,
            commercial=commercial,
            client=client,
            date_mouvement=date,
            commentaire="Dépôt de test",
        )

    def _vendre(self, client, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="VENTE_DECLAREE",
            produit=produit,
            quantite=quantite,
            client=client,
            commercial=client.commercial,
            date_mouvement=date,
            commentaire="Vente déclarée de test",
        )

    def _retourner(self, client, commercial, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="RETOUR_CLIENT",
            produit=produit,
            quantite=quantite,
            client=client,
            commercial=commercial,
            date_mouvement=date,
            commentaire="Retour de test",
        )

    def _encaisser(self, client, montant, collecte_par, date):
        enregistrer_encaissement(
            uuid=uuid.uuid4(),
            client=client,
            montant=montant,
            collecte_par=collecte_par,
            date_encaissement=date,
            commentaire="Encaissement de test",
        )

    def _recevoir(self, point_de_vente, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="ENTREE_DEPOT",
            produit=produit,
            quantite=quantite,
            point_de_vente=point_de_vente,
            date_mouvement=date,
            commentaire="Réception de test",
        )

    def _vendre_directement(self, point_de_vente, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="VENTE_DIRECTE",
            produit=produit,
            quantite=quantite,
            point_de_vente=point_de_vente,
            date_mouvement=date,
            commentaire="Vente directe de test",
        )

    def _reserver(self, point_de_vente, nom_client, telephone_client, type_evenement, nombre_personnes, date, statut=Reservation.Statut.CONFIRMEE):
        Reservation.objects.get_or_create(
            point_de_vente=point_de_vente,
            nom_client=nom_client,
            date_reservation=date,
            defaults={
                "uuid": uuid.uuid4(),
                "telephone_client": telephone_client,
                "type_evenement": type_evenement,
                "nombre_personnes": nombre_personnes,
                "statut": statut,
            },
        )

    # -- Reset --------------------------------------------------------------

    def _reset(self):
        """
        Supprime les données de test dans l'ordre inverse des
        dépendances : tout ce qui protège (on_delete=PROTECT) un
        commercial, un client, un produit ou un point de vente de
        test doit disparaître avant eux.
        """
        User = get_user_model()

        Encaissement.objects.filter(
            client__commercial__utilisateur__username__in=USERNAMES_COMMERCIAUX
        ).delete()
        MouvementStock.objects.filter(
            Q(commercial__utilisateur__username__in=USERNAMES_COMMERCIAUX)
            | Q(client__commercial__utilisateur__username__in=USERNAMES_COMMERCIAUX)
            | Q(point_de_vente__nom__in=NOMS_POINTS_DE_VENTE)
        ).delete()
        Reservation.objects.filter(point_de_vente__nom__in=NOMS_POINTS_DE_VENTE).delete()
        StockPointDeVente.objects.filter(point_de_vente__nom__in=NOMS_POINTS_DE_VENTE).delete()

        Client.objects.filter(commercial__utilisateur__username__in=USERNAMES_COMMERCIAUX).delete()
        Commercial.objects.filter(utilisateur__username__in=USERNAMES_COMMERCIAUX).delete()
        User.objects.filter(username__in=USERNAMES_COMMERCIAUX).delete()

        Tarif.objects.filter(produit__reference__in=REFERENCES_PRODUITS).delete()
        Produit.objects.filter(reference__in=REFERENCES_PRODUITS).delete()
        PointDeVente.objects.filter(nom__in=NOMS_POINTS_DE_VENTE).delete()

        self.stdout.write("Anciennes données de test supprimées.")
