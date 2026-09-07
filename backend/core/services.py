"""
Point d'entrée unique pour toute écriture qui touche un solde
(marchandise ou financier) d'un client ou d'un commercial.

Toujours passer par ces fonctions plutôt que de créer un
MouvementStock/Encaissement à la main : elles garantissent que
l'écriture et la mise à jour des soldes se font dans une seule
transaction atomique, avec F() pour éviter les conditions de course.
"""

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from core.models import Client, Commercial, Encaissement, MouvementStock, Tarif


def _ajuster_solde_client(client, *, delta_marchandise=None, delta_financier=None):
    updates = {}
    if delta_marchandise:
        updates["solde_marchandise"] = F("solde_marchandise") + delta_marchandise
    if delta_financier:
        updates["solde_financier"] = F("solde_financier") + delta_financier
    if updates:
        Client.objects.filter(pk=client.pk).update(**updates)


def _ajuster_solde_commercial(commercial, *, delta_marchandise=None, delta_financier=None):
    updates = {}
    if delta_marchandise:
        updates["solde_marchandise"] = F("solde_marchandise") + delta_marchandise
    if delta_financier:
        updates["solde_financier"] = F("solde_financier") + delta_financier
    if updates:
        Commercial.objects.filter(pk=commercial.pk).update(**updates)


# Effet de chaque type de mouvement sur les soldes marchandise du
# client et du commercial concernés (en multiples du montant valorisé).
_EFFETS_MARCHANDISE = {
    MouvementStock.TypeMouvement.AFFECTATION_COMMERCIAL: {"commercial": 1},
    MouvementStock.TypeMouvement.DEPOT_CLIENT: {"commercial": -1, "client": 1},
    MouvementStock.TypeMouvement.VENTE_DECLAREE: {"client": -1},
    MouvementStock.TypeMouvement.RETOUR_CLIENT: {"client": -1, "commercial": 1},
    MouvementStock.TypeMouvement.RETOUR_DEPOT: {"commercial": -1},
    # ENTREE_DEPOT, VENTE_DIRECTE, PERTE : pas d'effet sur un solde
    # client/commercial (stock de point de vente, ou perte sèche).
}

# VENTE_DECLAREE fait basculer la valeur du solde marchandise du
# client vers son solde financier (la vente est désormais reconnue).
_EFFETS_FINANCIER = {
    MouvementStock.TypeMouvement.VENTE_DECLAREE: {"client": 1},
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
    Crée un MouvementStock et répercute son effet sur les soldes concernés.

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

    if montant is not None:
        effets_marchandise = _EFFETS_MARCHANDISE.get(type, {})
        effets_financier = _EFFETS_FINANCIER.get(type, {})

        if client is not None and ("client" in effets_marchandise or "client" in effets_financier):
            _ajuster_solde_client(
                client,
                delta_marchandise=montant * effets_marchandise["client"]
                if "client" in effets_marchandise
                else None,
                delta_financier=montant * effets_financier["client"]
                if "client" in effets_financier
                else None,
            )

        if commercial is not None and "commercial" in effets_marchandise:
            _ajuster_solde_commercial(
                commercial, delta_marchandise=montant * effets_marchandise["commercial"]
            )

    return mouvement


@transaction.atomic
def enregistrer_encaissement(
    *,
    uuid,
    client,
    montant,
    moyen_paiement=Encaissement.MoyenPaiement.ESPECES,
    collecte_par=None,
    date_encaissement=None,
    commentaire="",
    cree_par=None,
):
    """
    Crée un Encaissement et diminue le solde financier du client d'autant.

    Idempotent sur `uuid`, pour les mêmes raisons que
    enregistrer_mouvement_stock.
    """

    existant = Encaissement.objects.filter(uuid=uuid).first()
    if existant is not None:
        return existant

    encaissement = Encaissement.objects.create(
        uuid=uuid,
        client=client,
        collecte_par=collecte_par,
        montant=montant,
        moyen_paiement=moyen_paiement,
        date_encaissement=date_encaissement or timezone.now(),
        commentaire=commentaire,
        cree_par=cree_par,
    )

    _ajuster_solde_client(client, delta_financier=-montant)
    if collecte_par is not None:
        # L'argent est physiquement chez le commercial tant qu'il ne
        # l'a pas remis à la société (flux de remise à implémenter).
        _ajuster_solde_commercial(collecte_par, delta_financier=montant)

    return encaissement
