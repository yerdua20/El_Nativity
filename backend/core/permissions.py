from rest_framework import permissions


def commercial_de(request):
    """Le Commercial lié à l'utilisateur connecté, ou None (ex : compte staff)."""
    return getattr(request.user, "commercial", None)


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
