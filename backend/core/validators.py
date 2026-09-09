import re

from django.core.exceptions import ValidationError


class PolitiqueMotDePasseValidator:
    """
    Applique la politique de mot de passe configurée dans Entreprise
    (onglet Sécurité de Paramètres, réservé au staff) : longueur
    minimale, majuscule/chiffre/caractère spécial exigés ou non.
    """

    def validate(self, password, user=None):
        from core.models import Entreprise

        politique = Entreprise.charger()

        if len(password) < politique.mdp_longueur_min:
            raise ValidationError(
                f"Le mot de passe doit contenir au moins {politique.mdp_longueur_min} caractères.",
                code="password_too_short",
            )
        if politique.mdp_exiger_majuscule and not re.search(r"[A-Z]", password):
            raise ValidationError(
                "Le mot de passe doit contenir au moins une majuscule.",
                code="password_no_upper",
            )
        if politique.mdp_exiger_chiffre and not re.search(r"[0-9]", password):
            raise ValidationError(
                "Le mot de passe doit contenir au moins un chiffre.",
                code="password_no_digit",
            )
        if politique.mdp_exiger_caractere_special and not re.search(r"[^A-Za-z0-9]", password):
            raise ValidationError(
                "Le mot de passe doit contenir au moins un caractère spécial.",
                code="password_no_special",
            )

    def get_help_text(self):
        return "Le mot de passe doit respecter la politique de sécurité configurée par l'entreprise."
