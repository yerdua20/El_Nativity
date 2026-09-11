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
NOMS_CLIENTS_CASH = ["Boutique Bella"]


class Command(BaseCommand):
    """
    Crée un jeu de données fictif (points de vente, produits, tarifs,
    personnel, marchands en dépôt-vente, clients cash, mouvements,
    encaissements, stock de bar, réservations) pour tester
    l'application de bout en bout sans toucher à de vraies données.

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

            # Personnel de La Nativité : gérant et chargée des ventes,
            # qui n'ont pas de portefeuille propre, juste un tag
            # d'audit sur les dépôts qu'ils enregistrent.
            gerant = self._creer_commercial(depot, "Koffi", "Amégnran", "90 11 22 33", username="koffi.amegnran")
            chargee_ventes = self._creer_commercial(depot, "Afiwa", "Dogbe", "91 44 55 66", username="afiwa.dogbe")

            marchands_gerant = [
                self._creer_marchand(gerant, "Boutique Bon Prix", "90 12 34 56", "Adidogomé, Lomé"),
                self._creer_marchand(gerant, "Alimentation Grâce", "90 65 43 21", "Agbalépédogan, Lomé"),
                self._creer_marchand(gerant, "Kiosque Espoir", "90 77 88 99", "Bè, Lomé"),
            ]
            marchands_chargee = [
                self._creer_marchand(chargee_ventes, "Supérette Aïda", "91 22 33 44", "Tokoin, Lomé"),
                self._creer_marchand(chargee_ventes, "Dépôt Faveur", "91 55 66 77", "Hédzranawoé, Lomé"),
            ]

            maintenant = timezone.now()

            # Réception de stock au dépôt central (un seul lot commun,
            # transporté par le tricycle, avant d'être réparti chez les marchands).
            self._recevoir(depot, produits["biere"], Decimal("60"), maintenant - timedelta(days=11))
            self._recevoir(depot, produits["soda"], Decimal("40"), maintenant - timedelta(days=11))
            self._recevoir(depot, produits["eau"], Decimal("50"), maintenant - timedelta(days=11))

            # Dépôts chez les marchands (puise directement dans le
            # stock du dépôt central, tagué avec le membre du
            # personnel qui a fait le dépôt).
            self._deposer(gerant, marchands_gerant[0], produits["biere"], Decimal("8"), maintenant - timedelta(days=9))
            self._deposer(gerant, marchands_gerant[1], produits["soda"], Decimal("6"), maintenant - timedelta(days=9))
            self._deposer(gerant, marchands_gerant[2], produits["biere"], Decimal("5"), maintenant - timedelta(days=7))
            self._deposer(chargee_ventes, marchands_chargee[0], produits["eau"], Decimal("12"), maintenant - timedelta(days=7))
            self._deposer(chargee_ventes, marchands_chargee[1], produits["biere"], Decimal("6"), maintenant - timedelta(days=6))

            # Ventes déclarées par certains marchands (bascule marchandise -> financier).
            self._vendre(marchands_gerant[0], produits["biere"], Decimal("5"), maintenant - timedelta(days=4))
            self._vendre(marchands_gerant[1], produits["soda"], Decimal("6"), maintenant - timedelta(days=3))
            self._vendre(marchands_chargee[0], produits["eau"], Decimal("9"), maintenant - timedelta(days=2))

            # Un retour de marchandise invendue, vers le dépôt central.
            self._retourner(marchands_gerant[2], gerant, produits["biere"], Decimal("2"), maintenant - timedelta(days=1))

            # Encaissements (règlements partiels).
            self._encaisser(marchands_gerant[0], Decimal("2500"), gerant, maintenant - timedelta(days=1))
            self._encaisser(marchands_chargee[0], Decimal("1500"), chargee_ventes, maintenant)

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

            # Client cash (Circuit 1) : commande et paie comptant au
            # dépôt, aucun solde à suivre, juste sa fiche et son historique.
            client_bella = self._creer_client_cash(
                "Boutique Bella", "90 44 33 22", "Marché d'Adawlato, Lomé",
                latitude=Decimal("6.135831"), longitude=Decimal("1.222273"),
            )
            self._vendre_directement(
                depot, produits["biere"], Decimal("6"), maintenant - timedelta(days=6), client=client_bella
            )
            self._vendre_directement(
                depot, produits["eau"], Decimal("10"), maintenant, client=client_bella
            )

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
        self.stdout.write("Comptes du personnel créés (mot de passe : test1234) :")
        self.stdout.write("  - koffi.amegnran (gérant)")
        self.stdout.write("  - afiwa.dogbe (chargée des ventes)")

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

    def _creer_marchand(self, commercial, nom, telephone, adresse):
        marchand, _ = Client.objects.get_or_create(
            commercial=commercial,
            nom=nom,
            defaults={"mode_vente": Client.ModeVente.DEPOT_VENTE, "telephone": telephone, "adresse": adresse},
        )
        return marchand

    # -- Mouvements / encaissements ---------------------------------------

    def _deposer(self, commercial, marchand, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="DEPOT_CLIENT",
            produit=produit,
            quantite=quantite,
            commercial=commercial,
            client=marchand,
            date_mouvement=date,
            commentaire="Dépôt de test",
        )

    def _vendre(self, marchand, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="VENTE_DECLAREE",
            produit=produit,
            quantite=quantite,
            client=marchand,
            commercial=marchand.commercial,
            date_mouvement=date,
            commentaire="Vente déclarée de test",
        )

    def _retourner(self, marchand, commercial, produit, quantite, date):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="RETOUR_CLIENT",
            produit=produit,
            quantite=quantite,
            client=marchand,
            commercial=commercial,
            date_mouvement=date,
            commentaire="Retour de test",
        )

    def _encaisser(self, marchand, montant, collecte_par, date):
        enregistrer_encaissement(
            uuid=uuid.uuid4(),
            client=marchand,
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

    def _vendre_directement(self, point_de_vente, produit, quantite, date, client=None):
        enregistrer_mouvement_stock(
            uuid=uuid.uuid4(),
            type="VENTE_DIRECTE",
            produit=produit,
            quantite=quantite,
            point_de_vente=point_de_vente,
            client=client,
            date_mouvement=date,
            commentaire="Vente directe de test",
        )

    def _creer_client_cash(self, nom, telephone, adresse, latitude=None, longitude=None):
        client, _ = Client.objects.get_or_create(
            nom=nom,
            mode_vente=Client.ModeVente.CASH,
            defaults={
                "telephone": telephone,
                "adresse": adresse,
                "latitude": latitude,
                "longitude": longitude,
            },
        )
        return client

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

        Client.objects.filter(
            Q(commercial__utilisateur__username__in=USERNAMES_COMMERCIAUX)
            | Q(nom__in=NOMS_CLIENTS_CASH)
        ).delete()
        Commercial.objects.filter(utilisateur__username__in=USERNAMES_COMMERCIAUX).delete()
        User.objects.filter(username__in=USERNAMES_COMMERCIAUX).delete()

        Tarif.objects.filter(produit__reference__in=REFERENCES_PRODUITS).delete()
        Produit.objects.filter(reference__in=REFERENCES_PRODUITS).delete()
        PointDeVente.objects.filter(nom__in=NOMS_POINTS_DE_VENTE).delete()

        self.stdout.write("Anciennes données de test supprimées.")
