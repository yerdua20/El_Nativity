import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Crée un superutilisateur à partir de variables d'environnement, si
    aucun n'existe encore. Pensé pour tourner à chaque build (build.sh)
    sur un hébergeur sans accès shell (ex : plan gratuit Render).
    """

    help = "Crée le superutilisateur initial depuis DJANGO_SUPERUSER_* si besoin."

    def handle(self, *args, **options):
        User = get_user_model()

        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("Un superutilisateur existe déjà, rien à faire.")
            return

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")

        if not username or not password:
            self.stdout.write(
                "DJANGO_SUPERUSER_USERNAME/DJANGO_SUPERUSER_PASSWORD non définis, "
                "aucun superutilisateur créé."
            )
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(f"Superutilisateur '{username}' créé.")
