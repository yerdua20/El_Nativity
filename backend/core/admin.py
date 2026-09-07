from django.contrib import admin

from core.models import (
    Client,
    Commercial,
    Encaissement,
    MouvementStock,
    PointDeVente,
    Produit,
    Tarif,
)


@admin.register(PointDeVente)
class PointDeVenteAdmin(admin.ModelAdmin):
    list_display = ("nom", "type_pdv", "actif")
    list_filter = ("type_pdv", "actif")
    search_fields = ("nom",)


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ("nom", "reference", "unite", "actif")
    list_filter = ("actif",)
    search_fields = ("nom", "reference")


@admin.register(Tarif)
class TarifAdmin(admin.ModelAdmin):
    list_display = ("produit", "point_de_vente", "prix", "date_effet")
    list_filter = ("point_de_vente",)
    search_fields = ("produit__nom",)


@admin.register(Commercial)
class CommercialAdmin(admin.ModelAdmin):
    list_display = (
        "nom",
        "prenom",
        "point_de_vente",
        "actif",
        "solde_marchandise",
        "solde_financier",
    )
    list_filter = ("actif", "point_de_vente")
    search_fields = ("nom", "prenom", "telephone")
    readonly_fields = ("solde_marchandise", "solde_financier")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "nom",
        "commercial",
        "actif",
        "solde_marchandise",
        "solde_financier",
    )
    list_filter = ("actif", "commercial")
    search_fields = ("nom", "telephone")
    readonly_fields = ("solde_marchandise", "solde_financier")


@admin.register(MouvementStock)
class MouvementStockAdmin(admin.ModelAdmin):
    list_display = (
        "date_mouvement",
        "type",
        "produit",
        "quantite",
        "montant",
        "commercial",
        "client",
        "point_de_vente",
    )
    list_filter = ("type", "point_de_vente")
    search_fields = ("uuid", "produit__nom")
    readonly_fields = ("prix_unitaire", "montant", "created_at")


@admin.register(Encaissement)
class EncaissementAdmin(admin.ModelAdmin):
    list_display = (
        "date_encaissement",
        "client",
        "montant",
        "moyen_paiement",
        "collecte_par",
    )
    list_filter = ("moyen_paiement",)
    search_fields = ("uuid", "client__nom")
    readonly_fields = ("created_at",)
