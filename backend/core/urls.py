from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter

from core import views

router = DefaultRouter()
router.register("points-de-vente", views.PointDeVenteViewSet, basename="point-de-vente")
router.register("produits", views.ProduitViewSet, basename="produit")
router.register("tarifs", views.TarifViewSet, basename="tarif")
router.register("commerciaux", views.CommercialViewSet, basename="commercial")
router.register("clients", views.ClientViewSet, basename="client")
router.register("mouvements-stock", views.MouvementStockViewSet, basename="mouvement-stock")
router.register("encaissements", views.EncaissementViewSet, basename="encaissement")
router.register("utilisateurs", views.UserAdminViewSet, basename="utilisateur")

urlpatterns = [
    path("sante/", views.sante, name="sante"),
    path("auth/token/", obtain_auth_token, name="obtenir-token"),
    path("auth/moi/", views.MoiView.as_view(), name="moi"),
    path(
        "auth/changer-mot-de-passe/",
        views.ChangerMotDePasseView.as_view(),
        name="changer-mot-de-passe",
    ),
    path("entreprise/", views.EntrepriseView.as_view(), name="entreprise"),
    path("export/", views.ExportCSVView.as_view(), name="export"),
    path("", include(router.urls)),
]
