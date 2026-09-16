from rest_framework import permissions


def commercial_de(request):
    """Le Commercial lié à l'utilisateur connecté, ou None (ex : compte staff)."""
    return getattr(request.user, "commercial", None)


# Niveaux d'accès, du plus au moins large. Un seul lot de marchandise
# commun à tout le personnel (pas de portefeuille individuel) : ces
# niveaux ne servent qu'à restreindre certaines ÉCRITURES, jamais la
# lecture, qui reste ouverte à tout le personnel connecté.
#
# Gérant et chargé(e) des ventes ont des périmètres distincts : le
# gérant s'occupe du bar/restaurant/place de fêtes et du personnel,
# la chargée des ventes s'occupe des marchands, des clients et des
# ventes en dépôt-vente.
ADMIN = "ADMIN"
PDG = "PDG"
GERANT = "GERANT"
CHARGE_VENTES = "CHARGE_VENTES"
COMPTABLE = "COMPTABLE"


def niveau_acces(request):
    """
    Niveau d'accès de l'utilisateur connecté :
    - ADMIN : compte technique (is_staff), tout accès.
    - PDG : tout accès métier, sauf gestion des comptes utilisateurs.
    - GERANT : vente directe (bar/restaurant), réservations, personnel.
    - CHARGE_VENTES : marchands, clients, dépôts/ventes/retours/encaissements.
    - COMPTABLE : comptable (par défaut aussi pour un rôle "Autre"
      non catégorisé) : lecture seule sur les écrans opérationnels.
    """
    user = request.user
    if not user or not user.is_authenticated:
        return None
    if user.is_staff:
        return ADMIN

    from core.models import Commercial

    commercial = getattr(user, "commercial", None)
    role = commercial.role if commercial else None
    if role == Commercial.Role.PDG:
        return PDG
    if role == Commercial.Role.GERANT:
        return GERANT
    if role == Commercial.Role.CHARGE_VENTES:
        return CHARGE_VENTES
    return COMPTABLE


class EstStaffPourEcriture(permissions.BasePermission):
    """
    Lecture ouverte à tout utilisateur authentifié, écriture réservée
    au staff. Utilisé pour les données de référence (catalogue, tarifs,
    points de vente) que les commerciaux terrain ne doivent pas modifier.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class EcritureReserveeAuNiveau(permissions.BasePermission):
    """
    Lecture ouverte à tout utilisateur authentifié, écriture réservée
    aux niveaux d'accès listés dans `niveaux_autorises` (à définir sur
    une sous-classe).
    """

    niveaux_autorises = ()

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return niveau_acces(request) in self.niveaux_autorises


class EcritureCatalogue(EcritureReserveeAuNiveau):
    """Produits, tarifs, points de vente : décisions réservées à la direction."""

    niveaux_autorises = (ADMIN, PDG)


class EcriturePersonnels(EcritureReserveeAuNiveau):
    """Créer/modifier le personnel : direction + gérant (qui s'en occupe)."""

    niveaux_autorises = (ADMIN, PDG, GERANT)


class EcritureMarchandsClients(EcritureReserveeAuNiveau):
    """
    Marchands, clients cash, encaissements : le domaine de la chargée
    des ventes. Le gérant reste en lecture seule sur ces écrans.
    """

    niveaux_autorises = (ADMIN, PDG, CHARGE_VENTES)


class EcritureVenteDirecteEtReservations(EcritureReserveeAuNiveau):
    """
    Vente directe (bar/restaurant) et réservations (place de fêtes) :
    le domaine du gérant. La chargée des ventes reste en lecture seule.
    """

    niveaux_autorises = (ADMIN, PDG, GERANT)


class EcritureReceptionStock(EcritureReserveeAuNiveau):
    """
    Réception de stock au dépôt central : nécessaire aux deux circuits
    (gérant comme chargée des ventes), fermée au comptable.
    """

    niveaux_autorises = (ADMIN, PDG, GERANT, CHARGE_VENTES)


# Qui peut enregistrer quel type de mouvement de stock : dépend du
# type, pas seulement du rôle, puisqu'un même endpoint sert les deux
# circuits (vente directe côté gérant, marchands côté chargée des
# ventes) plus la réception de stock, commune aux deux.
NIVEAUX_PAR_TYPE_MOUVEMENT = {
    "ENTREE_DEPOT": (ADMIN, PDG, GERANT, CHARGE_VENTES),
    "DEPOT_CLIENT": (ADMIN, PDG, CHARGE_VENTES),
    "VENTE_DECLAREE": (ADMIN, PDG, CHARGE_VENTES),
    "RETOUR_CLIENT": (ADMIN, PDG, CHARGE_VENTES),
    "VENTE_DIRECTE": (ADMIN, PDG, GERANT),
    "PERTE": (ADMIN, PDG, GERANT, CHARGE_VENTES),
}


class EcritureMouvementStock(permissions.BasePermission):
    """Autorise l'écriture selon le type de mouvement (voir NIVEAUX_PAR_TYPE_MOUVEMENT)."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        type_ = request.data.get("type")
        niveaux_autorises = NIVEAUX_PAR_TYPE_MOUVEMENT.get(type_, (ADMIN, PDG))
        return niveau_acces(request) in niveaux_autorises
