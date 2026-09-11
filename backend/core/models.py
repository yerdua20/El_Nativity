"""
Modèles métier de l'application.

Deux lignes d'activité cohabitent :
- la distribution en dépôt-vente vers des marchands (Client avec
  mode_vente=DEPOT_VENTE), à qui de la marchandise est confiée sans
  paiement immédiat ;
- l'exploitation directe de points de vente (dépôt, bars, restaurant),
  qui couvre aussi les clients cash (Client avec mode_vente=CASH) qui
  paient comptant et n'ont aucun solde à suivre dans le temps.

Un « commercial » (Commercial) est un membre du personnel (gérant,
chargée des ventes...) qui n'a plus de portefeuille ni de solde
individuel : la marchandise part du dépôt central comme un lot
commun (un seul moyen de transport), personne n'en est responsable
individuellement. Le champ `commercial` sur un dépôt chez un marchand
sert uniquement de tag d'audit (« qui a fait ce dépôt »).

Seul le marchand (Client, mode_vente=DEPOT_VENTE) porte un solde
suivi dans le temps :

- solde_marchandise = déposé - vendu déclaré - retourné
  (valeur de la marchandise en dépôt dont il faut encore rendre
  compte, en stock ou en argent)
- solde_financier = ventes reconnues - encaissé
  (argent dû à la société pour des ventes déjà reconnues)

Ce solde ne doit être modifié que via les fonctions de
core/services.py, qui le mettent à jour dans une transaction
atomique en même temps que l'écriture (MouvementStock/Encaissement)
qui le justifie.
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
    Un membre du personnel (gérant, chargée des ventes...) qui peut
    être tagué comme responsable d'un dépôt chez un marchand — pur
    audit, sans solde ni portefeuille individuel : la marchandise
    part du dépôt central comme un lot commun.
    """

    class Role(models.TextChoices):
        PDG = "PDG", "PDG"
        GERANT = "GERANT", "Gérant"
        CHARGE_VENTES = "CHARGE_VENTES", "Chargé(e) des ventes"
        COMPTABLE = "COMPTABLE", "Comptable"
        AUTRE = "AUTRE", "Autre"

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
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AUTRE)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=30, blank=True)
    date_entree = models.DateField()
    date_sortie = models.DateField(
        null=True,
        blank=True,
        help_text="Renseignée au départ du commercial ; les marchands qu'il a tagués restent consultables.",
    )
    actif = models.BooleanField(default=True)

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
    Selon deux circuits distincts (voir `mode_vente`) :

    - DEPOT_VENTE : un « marchand », à qui de la marchandise est
      confiée sans paiement immédiat (dépôt-vente classique). Les
      soldes marchandise/financier ci-dessous suivent ce qu'il doit
      encore. `commercial` est le membre du personnel tagué comme
      responsable de ce dépôt (audit, pas de solde de son côté).
    - CASH : un « client », qui passe commande et paie comptant
      directement au dépôt. Rien à suivre dans le temps pour lui :
      les soldes restent à zéro, on garde juste sa fiche
      (coordonnées, localisation) et l'historique de ses achats.
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
        DEPOT_CLIENT = "DEPOT_CLIENT", "Dépôt chez un marchand"
        VENTE_DECLAREE = "VENTE_DECLAREE", "Vente déclarée par un marchand"
        RETOUR_CLIENT = "RETOUR_CLIENT", "Retour du marchand vers le dépôt"
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
    Argent reçu au titre du solde financier d'un marchand
    (Client, mode_vente=DEPOT_VENTE).

    `collecte_par` ne sert que d'audit (qui a physiquement collecté
    cet argent) : le commercial n'a pas de solde propre à ajuster.
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
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Montant net qui diminue le solde financier (montant_recu - monnaie_rendue).",
    )
    montant_recu = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Montant brut physiquement remis par le marchand, avant rendu de monnaie.",
    )
    monnaie_rendue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Monnaie rendue au marchand sur le montant reçu.",
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
