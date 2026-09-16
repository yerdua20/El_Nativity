from rest_framework import permissions


def commercial_de(request):
    """Le Commercial lié à l'utilisateur connecté, ou None (ex : compte staff)."""
    return getattr(request.user, "commercial", None)


# Niveaux d'accès, du plus au moins large. Un seul lot de marchandise
# commun à tout le personnel (pas de portefeuille individuel) : ces
# niveaux ne servent qu'à restreindre certaines ÉCRITURES, jamais la
# lecture, qui reste ouverte à tout le personnel connecté.
ADMIN = "ADMIN"
PDG = "PDG"
OPERATIONNEL = "OPERATIONNEL"
COMPTABLE = "COMPTABLE"


def niveau_acces(request):
    """
    Niveau d'accès de l'utilisateur connecté :
    - ADMIN : compte technique (is_staff), tout accès.
    - PDG : tout accès métier, sauf gestion des comptes utilisateurs.
    - OPERATIONNEL : gérant / chargé(e) des ventes, opérations terrain.
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
    if role in (Commercial.Role.GERANT, Commercial.Role.CHARGE_VENTES):
        return OPERATIONNEL
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
    """Créer/modifier le personnel : réservé à la direction."""

    niveaux_autorises = (ADMIN, PDG)


class EcritureOperationnelle(EcritureReserveeAuNiveau):
    """
    Dépôts, ventes, retours, encaissements, clients/marchands,
    réservations : ouvert au personnel de terrain, fermé au comptable
    (lecture seule pour lui sur ces écrans).
    """

    niveaux_autorises = (ADMIN, PDG, OPERATIONNEL)
