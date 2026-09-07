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

urlpatterns = [
    path("sante/", views.sante, name="sante"),
    path("auth/token/", obtain_auth_token, name="obtenir-token"),
    path("", include(router.urls)),
]
