from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.models import (
    Client,
    Commercial,
    Encaissement,
    Entreprise,
    MouvementStock,
    PointDeVente,
    Produit,
    Reservation,
    StockPointDeVente,
    Tarif,
)
from core.permissions import commercial_de
from core.services import enregistrer_encaissement, enregistrer_mouvement_stock

User = get_user_model()


class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = [
            "nom",
            "email_contact",
            "telephone",
            "adresse",
            "devise",
            "mdp_longueur_min",
            "mdp_exiger_majuscule",
            "mdp_exiger_chiffre",
            "mdp_exiger_caractere_special",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "is_staff", "is_active", "date_joined"]
        read_only_fields = ["date_joined"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Mot de passe requis à la création."})
        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        validated_data.pop("password", None)
        return super().update(instance, validated_data)


class PointDeVenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointDeVente
        fields = ["id", "nom", "type_pdv", "adresse", "actif", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class ProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = ["id", "nom", "reference", "unite", "actif", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class TarifSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tarif
        fields = ["id", "produit", "point_de_vente", "prix", "date_effet", "created_at"]
        read_only_fields = ["created_at"]


class CommercialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commercial
        fields = [
            "id",
            "utilisateur",
            "point_de_vente",
            "nom",
            "prenom",
            "telephone",
            "date_entree",
            "date_sortie",
            "actif",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "mode_vente",
            "commercial",
            "nom",
            "telephone",
            "adresse",
            "latitude",
            "longitude",
            "actif",
            "solde_marchandise",
            "solde_financier",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "solde_marchandise",
            "solde_financier",
            "created_at",
            "updated_at",
        ]

    def validate_commercial(self, commercial):
        if commercial is None:
            return commercial
        request = self.context["request"]
        if not request.user.is_staff:
            proprietaire = commercial_de(request)
            if proprietaire is None or commercial.pk != proprietaire.pk:
                raise serializers.ValidationError(
                    "Vous ne pouvez créer un client que pour vous-même."
                )
        return commercial

    def validate(self, attrs):
        mode_vente = attrs.get("mode_vente", getattr(self.instance, "mode_vente", Client.ModeVente.DEPOT_VENTE))
        commercial = attrs.get("commercial", getattr(self.instance, "commercial", None))
        if mode_vente == Client.ModeVente.DEPOT_VENTE and commercial is None:
            raise serializers.ValidationError(
                {"commercial": "Obligatoire pour un client en dépôt-vente."}
            )
        return attrs


class MouvementStockSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField()

    class Meta:
        model = MouvementStock
        fields = [
            "id",
            "uuid",
            "type",
            "produit",
            "quantite",
            "prix_unitaire",
            "montant",
            "point_de_vente",
            "commercial",
            "client",
            "date_mouvement",
            "latitude",
            "longitude",
            "photo",
            "commentaire",
            "cree_par",
            "created_at",
        ]
        read_only_fields = ["prix_unitaire", "montant", "cree_par", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        type_ = attrs.get("type", getattr(self.instance, "type", None))
        client = attrs.get("client")

        if client is not None:
            if (
                type_ in ("DEPOT_CLIENT", "VENTE_DECLAREE", "RETOUR_CLIENT")
                and client.mode_vente != Client.ModeVente.DEPOT_VENTE
            ):
                raise serializers.ValidationError(
                    {"client": "Ce type de mouvement n'est possible qu'avec un client en dépôt-vente."}
                )
            if type_ == "VENTE_DIRECTE" and client.mode_vente != Client.ModeVente.CASH:
                raise serializers.ValidationError(
                    {"client": "Une vente directe ne peut être associée qu'à un client cash."}
                )

        if not request.user.is_staff:
            proprietaire = commercial_de(request)
            commercial = attrs.get("commercial")
            if commercial is not None and (proprietaire is None or commercial.pk != proprietaire.pk):
                raise serializers.ValidationError(
                    "Vous ne pouvez saisir un mouvement que sur votre propre portefeuille."
                )
            if client is not None and (
                proprietaire is None or client.commercial_id != proprietaire.pk
            ):
                raise serializers.ValidationError(
                    "Ce client n'est pas rattaché à votre portefeuille."
                )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return enregistrer_mouvement_stock(cree_par=request.user, **validated_data)


class EncaissementSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField()

    class Meta:
        model = Encaissement
        fields = [
            "id",
            "uuid",
            "client",
            "collecte_par",
            "montant",
            "moyen_paiement",
            "date_encaissement",
            "commentaire",
            "cree_par",
            "created_at",
        ]
        read_only_fields = ["cree_par", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        if not request.user.is_staff:
            proprietaire = commercial_de(request)
            client = attrs.get("client")
            collecte_par = attrs.get("collecte_par")
            if proprietaire is None or (client is not None and client.commercial_id != proprietaire.pk):
                raise serializers.ValidationError(
                    "Ce client n'est pas rattaché à votre portefeuille."
                )
            if collecte_par is not None and collecte_par.pk != proprietaire.pk:
                raise serializers.ValidationError(
                    "Vous ne pouvez déclarer avoir collecté que pour vous-même."
                )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return enregistrer_encaissement(cree_par=request.user, **validated_data)


class ReservationSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "uuid",
            "point_de_vente",
            "nom_client",
            "telephone_client",
            "type_evenement",
            "nombre_personnes",
            "date_reservation",
            "statut",
            "commentaire",
            "cree_par",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["cree_par", "created_at", "updated_at"]

    def create(self, validated_data):
        existante = Reservation.objects.filter(uuid=validated_data["uuid"]).first()
        if existante is not None:
            return existante
        request = self.context["request"]
        return Reservation.objects.create(cree_par=request.user, **validated_data)


class StockPointDeVenteSerializer(serializers.ModelSerializer):
    quantite_vendue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = StockPointDeVente
        fields = ["id", "point_de_vente", "produit", "quantite", "quantite_vendue", "updated_at"]
        read_only_fields = fields
