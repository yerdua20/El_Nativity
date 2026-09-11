"""
Modèles métier de l'application.

Deux lignes d'activité cohabitent :
- la distribution en dépôt-vente, via des commerciaux qui confient de
  la marchandise à des clients ;
- l'exploitation directe de points de vente (bars, restaurant).

Pour chaque client ET chaque commercial, deux soldes sont tenus à
jour, en valeur (et non en quantité, les commerciaux/clients portant
des produits hétérogènes) :

- solde_marchandise = déposé - vendu déclaré - retourné
  (valeur de la marchandise en dépôt dont il faut encore rendre
  compte, en stock ou en argent)
- solde_financier = ventes reconnues - encaissé
  (argent dû à la société pour des ventes déjà reconnues)

Ces soldes sont dénormalisés sur Client et Commercial pour un accès
rapide, mais ne doivent être modifiés que via les fonctions de
core/services.py, qui les mettent à jour dans une transaction
atomique en même temps que l'écriture (MouvementStock/Encaissement)
qui les justifie.
"""

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Entreprise(models.Model):
    """
    Reglages globaux de l'entreprise : un seul enregistrement (pk=1).
    Regroupe les infos generales (onglet "Général" de Paramètres) et la
    politique de mot de passe (onglet "Sécurité"), appliquee par
    core.validators.PolitiqueMotDePasseValidator.
    """

    class Devise(models.TextChoices):
        XOF = "XOF", "Franc CFA (XOF)"
        EUR = "EUR", "Euro"
        USD = "USD", "Dollar US"

    nom = models.CharField(max_length=200, default="La Nativité")
    email_contact = models.EmailField(blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    devise = models.CharField(max_length=3, choices=Devise.choices, default=Devise.XOF)

    mdp_longueur_min = models.PositiveSmallIntegerField(default=8)
    mdp_exiger_majuscule = models.BooleanField(default=True)
    mdp_exiger_chiffre = models.BooleanField(default=True)
    mdp_exiger_caractere_special = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Entreprise"
        verbose_name_plural = "Entreprise"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Le réglage Entreprise ne peut pas être supprimé.")

    @classmethod
    def charger(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return self.nom


class PointDeVente(models.Model):
    """Un dépôt central, un bar ou le restaurant."""

    class TypePointDeVente(models.TextChoices):
        DEPOT = "DEPOT", "Dépôt"
        BAR = "BAR", "Bar"
        RESTAURANT = "RESTAURANT", "Restaurant"

    nom = models.CharField(max_length=150)
    type_pdv = models.CharField(max_length=20, choices=TypePointDeVente.choices)
    adresse = models.CharField(max_length=255, blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Point de vente"
        verbose_name_plural = "Points de vente"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.get_type_pdv_display()})"


class Produit(models.Model):
    """
    Catalogue produit. Ne porte jamais de prix : les prix vivent
    exclusivement dans Tarif (produit × point de vente × date d'effet).
    """

    nom = models.CharField(max_length=150)
    reference = models.CharField(max_length=50, unique=True)
    unite = models.CharField(
        max_length=30, help_text="Unité de vente : carton, casier, bouteille, litre..."
    )
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.reference})"


class Tarif(models.Model):
    """Prix d'un produit pour un point de vente, à partir d'une date d'effet."""

    produit = models.ForeignKey(
        Produit, on_delete=models.PROTECT, related_name="tarifs"
    )
    point_de_vente = models.ForeignKey(
        PointDeVente, on_delete=models.PROTECT, related_name="tarifs"
    )
    prix = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    date_effet = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tarif"
        verbose_name_plural = "Tarifs"
        ordering = ["-date_effet"]
        constraints = [
            models.UniqueConstraint(
                fields=["produit", "point_de_vente", "date_effet"],
                name="tarif_unique_produit_pdv_date",
            )
        ]

    def __str__(self):
        return f"{self.produit} @ {self.point_de_vente} : {self.prix} ({self.date_effet})"

    @classmethod
    def en_vigueur(cls, produit, point_de_vente, a_la_date=None):
        """Renvoie le tarif applicable pour ce produit/point de vente à une date donnée."""
        from django.utils import timezone

        a_la_date = a_la_date or timezone.localdate()
        return (
            cls.objects.filter(
                produit=produit,
                point_de_vente=point_de_vente,
                date_effet__lte=a_la_date,
            )
            .order_by("-date_effet")
            .first()
        )


class Commercial(models.Model):
    """
    Un commercial confie de la marchandise à des clients (dépôt-vente).
    Rattaché à un dépôt (PointDeVente de type DEPOT) qui sert de
    référence pour la tarification de ses mouvements.
    """

    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="commercial",
    )
    point_de_vente = models.ForeignKey(
        PointDeVente,
        on_delete=models.PROTECT,
        related_name="commerciaux",
        help_text="Dépôt de rattachement, utilisé pour la tarification.",
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=30, blank=True)
    date_entree = models.DateField()
    date_sortie = models.DateField(
        null=True,
        blank=True,
        help_text="Renseignée au départ du commercial ; les soldes restent consultables.",
    )
    actif = models.BooleanField(default=True)

    solde_marchandise = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    solde_financier = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Commercial"
        verbose_name_plural = "Commerciaux"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class Client(models.Model):
    """
    Un client, selon deux circuits distincts (voir `mode_vente`) :

    - DEPOT_VENTE : un commercial lui confie de la marchandise sans
      paiement immédiat (dépôt-vente classique). Les soldes
      marchandise/financier ci-dessous suivent ce qu'il doit encore.
    - CASH : un marchand qui achète et paie comptant directement
      au dépôt, sans commercial intermédiaire. Rien à suivre dans le
      temps pour lui : les soldes restent à zéro, on garde juste sa
      fiche (coordonnées, localisation) et l'historique de ses achats.
    """

    class ModeVente(models.TextChoices):
        DEPOT_VENTE = "DEPOT_VENTE", "Dépôt-vente"
        CASH = "CASH", "Cash"

    mode_vente = models.CharField(
        max_length=20, choices=ModeVente.choices, default=ModeVente.DEPOT_VENTE
    )
    commercial = models.ForeignKey(
        Commercial,
        on_delete=models.PROTECT,
        related_name="clients",
        null=True,
        blank=True,
        help_text="Obligatoire en dépôt-vente ; sans objet pour un client cash.",
    )
    nom = models.CharField(max_length=150)
    telephone = models.CharField(max_length=30, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    actif = models.BooleanField(default=True)

    solde_marchandise = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    solde_financier = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class MouvementStock(models.Model):
    """
    Table unique de tous les mouvements de marchandise, typée par `type`.

    Chaque ligne porte un UUID généré côté client au moment de la
    saisie (souvent hors ligne) : c'est la clé anti-doublon utilisée
    à la synchronisation.
    """

    class TypeMouvement(models.TextChoices):
        ENTREE_DEPOT = "ENTREE_DEPOT", "Entrée en dépôt (achat/réception)"
        AFFECTATION_COMMERCIAL = (
            "AFFECTATION_COMMERCIAL",
            "Affectation à un commercial",
        )
        DEPOT_CLIENT = "DEPOT_CLIENT", "Dépôt chez un client"
        VENTE_DECLAREE = "VENTE_DECLAREE", "Vente déclarée par un client"
        RETOUR_CLIENT = "RETOUR_CLIENT", "Retour du client vers le commercial"
        RETOUR_DEPOT = "RETOUR_DEPOT", "Retour du commercial vers le dépôt"
        VENTE_DIRECTE = "VENTE_DIRECTE", "Vente directe en point de vente"
        PERTE = "PERTE", "Perte / casse"

    uuid = models.UUIDField(unique=True, editable=False)
    type = models.CharField(max_length=30, choices=TypeMouvement.choices)

    produit = models.ForeignKey(
        Produit, on_delete=models.PROTECT, related_name="mouvements"
    )
    quantite = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Tarif en vigueur au moment du mouvement, figé pour l'historique.",
    )
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="quantite x prix_unitaire, figé pour l'historique.",
    )

    point_de_vente = models.ForeignKey(
        PointDeVente,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="mouvements",
    )
    commercial = models.ForeignKey(
        Commercial,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="mouvements",
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="mouvements",
    )

    date_mouvement = models.DateTimeField(
        help_text="Horodatage de la saisie terrain, pas de la synchronisation."
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Capturée au moment de la saisie, notamment pour un dépôt.",
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    photo = models.ImageField(upload_to="mouvements/%Y/%m/", null=True, blank=True)

    commentaire = models.TextField(blank=True)
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="mouvements_stock_crees",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Mouvement de stock"
        verbose_name_plural = "Mouvements de stock"
        ordering = ["-date_mouvement"]

    def __str__(self):
        return f"{self.get_type_display()} - {self.produit} x{self.quantite}"


class Encaissement(models.Model):
    """
    Argent reçu au titre du solde financier d'un client.

    Si un commercial a physiquement collecté cet argent pour le
    compte de la société (`collecte_par`), son propre solde_financier
    augmente d'autant : il en devient responsable jusqu'à remise en
    trésorerie (flux de remise non encore implémenté).
    """

    class MoyenPaiement(models.TextChoices):
        ESPECES = "ESPECES", "Espèces"
        MOBILE_MONEY = "MOBILE_MONEY", "Mobile money"
        VIREMENT = "VIREMENT", "Virement"
        AUTRE = "AUTRE", "Autre"

    uuid = models.UUIDField(unique=True, editable=False)
    client = models.ForeignKey(
        Client, on_delete=models.PROTECT, related_name="encaissements"
    )
    collecte_par = models.ForeignKey(
        Commercial,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="encaissements_collectes",
    )
    montant = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    moyen_paiement = models.CharField(
        max_length=20, choices=MoyenPaiement.choices, default=MoyenPaiement.ESPECES
    )
    date_encaissement = models.DateTimeField(
        help_text="Horodatage de la saisie terrain, pas de la synchronisation."
    )
    commentaire = models.TextField(blank=True)
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="encaissements_crees",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Encaissement"
        verbose_name_plural = "Encaissements"
        ordering = ["-date_encaissement"]

    def __str__(self):
        return f"{self.montant} de {self.client} ({self.get_moyen_paiement_display()})"


class Reservation(models.Model):
    """
    Réservation de table au bar ou au restaurant.

    Pas de notion de table individuelle ni de vérification de
    capacité : juste un nombre de personnes attendu à un créneau
    donné pour un point de vente. Le client n'est pas rattaché au
    modèle Client (dépôt-vente) : ses coordonnées sont en texte libre.
    """

    class Statut(models.TextChoices):
        CONFIRMEE = "CONFIRMEE", "Confirmée"
        ANNULEE = "ANNULEE", "Annulée"
        HONOREE = "HONOREE", "Honorée"

    uuid = models.UUIDField(unique=True, editable=False)
    point_de_vente = models.ForeignKey(
        PointDeVente, on_delete=models.PROTECT, related_name="reservations"
    )
    nom_client = models.CharField(max_length=150)
    telephone_client = models.CharField(max_length=30, blank=True)
    type_evenement = models.CharField(
        max_length=100,
        blank=True,
        help_text="Ex : anniversaire, mariage, baptême... Libre, pas de liste fermée.",
    )
    nombre_personnes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    date_reservation = models.DateTimeField(
        help_text="Date et heure prévues de la réservation."
    )
    statut = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.CONFIRMEE
    )
    commentaire = models.TextField(blank=True)
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reservations_creees",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Réservation"
        verbose_name_plural = "Réservations"
        ordering = ["date_reservation"]

    def __str__(self):
        return f"{self.nom_client} ({self.nombre_personnes} pers.) - {self.point_de_vente} - {self.date_reservation:%d/%m/%Y %H:%M}"


class StockPointDeVente(models.Model):
    """
    Quantité actuellement disponible d'un produit à un point de vente
    (dépôt, bar ou restaurant) — dénormalisée pour un accès rapide,
    mise à jour uniquement via core/services.py en même temps que le
    MouvementStock qui la justifie (même principe que les soldes
    client/commercial).
    """

    point_de_vente = models.ForeignKey(
        PointDeVente, on_delete=models.PROTECT, related_name="stocks"
    )
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT, related_name="stocks")
    quantite = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Stock point de vente"
        verbose_name_plural = "Stocks points de vente"
        ordering = ["point_de_vente__nom", "produit__nom"]
        constraints = [
            models.UniqueConstraint(
                fields=["point_de_vente", "produit"], name="stock_unique_pdv_produit"
            )
        ]

    def __str__(self):
        return f"{self.produit} @ {self.point_de_vente} : {self.quantite}"
