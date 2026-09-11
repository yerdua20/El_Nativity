"""
Point d'entrée unique pour toute écriture qui touche un solde
(marchandise ou financier) d'un marchand (Client, mode_vente=
DEPOT_VENTE), ou le stock d'un point de vente.

Toujours passer par ces fonctions plutôt que de créer un
MouvementStock/Encaissement à la main : elles garantissent que
l'écriture et la mise à jour des soldes/stock se font dans une seule
transaction atomique, avec F() pour éviter les conditions de course.
"""

from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from core.models import Client, Encaissement, MouvementStock, StockPointDeVente, Tarif


def _ajuster_solde_client(client, *, delta_marchandise=None, delta_financier=None):
    updates = {}
    if delta_marchandise:
        updates["solde_marchandise"] = F("solde_marchandise") + delta_marchandise
    if delta_financier:
        updates["solde_financier"] = F("solde_financier") + delta_financier
    if updates:
        Client.objects.filter(pk=client.pk).update(**updates)


def _ajuster_stock_point_de_vente(point_de_vente, produit, delta_quantite):
    stock, _ = StockPointDeVente.objects.get_or_create(
        point_de_vente=point_de_vente, produit=produit
    )
    StockPointDeVente.objects.filter(pk=stock.pk).update(
        quantite=F("quantite") + delta_quantite
    )


# Effet de chaque type de mouvement sur les soldes du marchand
# concerné (en multiples du montant valorisé). Le commercial n'a pas
# de solde propre : il ne sert que de tag d'audit sur le mouvement.
_EFFETS_MARCHANDISE = {
    MouvementStock.TypeMouvement.DEPOT_CLIENT: {"client": 1},
    MouvementStock.TypeMouvement.VENTE_DECLAREE: {"client": -1},
    MouvementStock.TypeMouvement.RETOUR_CLIENT: {"client": -1},
    # ENTREE_DEPOT, VENTE_DIRECTE, PERTE : pas d'effet sur un solde
    # marchand (stock de point de vente, ou perte sèche).
}

# VENTE_DECLAREE fait basculer la valeur du solde marchandise du
# marchand vers son solde financier (la vente est désormais reconnue).
_EFFETS_FINANCIER = {
    MouvementStock.TypeMouvement.VENTE_DECLAREE: {"client": 1},
}

# Effet de chaque type de mouvement sur le stock du point de vente
# concerné (en multiples de la quantité, pas de la valeur : un point
# de vente porte des unités physiques, pas un solde en argent).
# DEPOT_CLIENT/RETOUR_CLIENT résolvent leur point de vente via
# pdv_tarification (le dépôt de rattachement du commercial qui a fait
# le mouvement) : le dépôt chez un marchand puise directement dans le
# stock du dépôt central, il n'y a plus d'étape d'affectation.
_EFFETS_STOCK_POINT_DE_VENTE = {
    MouvementStock.TypeMouvement.ENTREE_DEPOT: 1,
    MouvementStock.TypeMouvement.DEPOT_CLIENT: -1,
    MouvementStock.TypeMouvement.RETOUR_CLIENT: 1,
    MouvementStock.TypeMouvement.VENTE_DIRECTE: -1,
    MouvementStock.TypeMouvement.PERTE: -1,
}


@transaction.atomic
def enregistrer_mouvement_stock(
    *,
    uuid,
    type,
    produit,
    quantite,
    point_de_vente=None,
    commercial=None,
    client=None,
    date_mouvement=None,
    latitude=None,
    longitude=None,
    photo=None,
    commentaire="",
    cree_par=None,
):
    """
    Crée un MouvementStock et répercute son effet sur les soldes/stock concernés.

    Idempotent sur `uuid` : un même mouvement resynchronisé après une
    coupure réseau (retry côté app hors ligne) renvoie l'enregistrement
    déjà créé au lieu d'échouer ou de rejouer l'effet sur les soldes.
    """

    existant = MouvementStock.objects.filter(uuid=uuid).first()
    if existant is not None:
        return existant

    pdv_tarification = point_de_vente or (commercial.point_de_vente if commercial else None)
    tarif = (
        Tarif.en_vigueur(produit, pdv_tarification, a_la_date=timezone.localdate())
        if pdv_tarification
        else None
    )
    prix_unitaire = tarif.prix if tarif else None
    montant = (prix_unitaire * quantite) if prix_unitaire is not None else None

    mouvement = MouvementStock.objects.create(
        uuid=uuid,
        type=type,
        produit=produit,
        quantite=quantite,
        prix_unitaire=prix_unitaire,
        montant=montant,
        point_de_vente=point_de_vente,
        commercial=commercial,
        client=client,
        date_mouvement=date_mouvement or timezone.now(),
        latitude=latitude,
        longitude=longitude,
        photo=photo,
        commentaire=commentaire,
        cree_par=cree_par,
    )

    if montant is not None and client is not None:
        effets_marchandise = _EFFETS_MARCHANDISE.get(type, {})
        effets_financier = _EFFETS_FINANCIER.get(type, {})
        if "client" in effets_marchandise or "client" in effets_financier:
            _ajuster_solde_client(
                client,
                delta_marchandise=montant * effets_marchandise["client"]
                if "client" in effets_marchandise
                else None,
                delta_financier=montant * effets_financier["client"]
                if "client" in effets_financier
                else None,
            )

    if pdv_tarification is not None:
        multiplicateur_stock = _EFFETS_STOCK_POINT_DE_VENTE.get(type)
        if multiplicateur_stock is not None:
            _ajuster_stock_point_de_vente(pdv_tarification, produit, quantite * multiplicateur_stock)

    return mouvement


@transaction.atomic
def enregistrer_encaissement(
    *,
    uuid,
    client,
    montant,
    montant_recu=None,
    monnaie_rendue=Decimal("0"),
    moyen_paiement=Encaissement.MoyenPaiement.ESPECES,
    collecte_par=None,
    date_encaissement=None,
    commentaire="",
    cree_par=None,
):
    """
    Crée un Encaissement et diminue le solde financier du marchand d'autant.

    Idempotent sur `uuid`, pour les mêmes raisons que
    enregistrer_mouvement_stock. `collecte_par` est un simple tag
    d'audit (qui a physiquement collecté l'argent) : le commercial
    n'a pas de solde propre à ajuster. `montant` est le montant net
    (ce qui diminue réellement le solde) ; montant_recu/monnaie_rendue
    ne sont conservés que pour la traçabilité de la transaction cash.
    """

    existant = Encaissement.objects.filter(uuid=uuid).first()
    if existant is not None:
        return existant

    encaissement = Encaissement.objects.create(
        uuid=uuid,
        client=client,
        collecte_par=collecte_par,
        montant=montant,
        montant_recu=montant_recu,
        monnaie_rendue=monnaie_rendue,
        moyen_paiement=moyen_paiement,
        date_encaissement=date_encaissement or timezone.now(),
        commentaire=commentaire,
        cree_par=cree_par,
    )

    _ajuster_solde_client(client, delta_financier=-montant)

    return encaissement
