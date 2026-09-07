"""
Configuration Django du projet gestion-affaires.

Aucun secret n'est écrit ici : toute valeur sensible ou dépendante de
l'environnement (clé secrète, mode debug, hôtes autorisés, base de
données...) est lue depuis les variables d'environnement. En local, un
fichier .env (non versionné, voir .env.example) peut fournir ces valeurs.
"""

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Charge un éventuel fichier .env local (absent en production sur Render,
# où les variables sont injectées directement dans l'environnement).
load_dotenv(BASE_DIR / ".env")


def _get_bool_env(name, default=False):
    valeur = os.environ.get(name)
    if valeur is None:
        return default
    return valeur.strip().lower() in ("1", "true", "yes", "on")


def _get_list_env(name, default=""):
    valeur = os.environ.get(name, default)
    return [item.strip() for item in valeur.split(",") if item.strip()]


# --- Sécurité de base -------------------------------------------------

SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    raise RuntimeError(
        "La variable d'environnement SECRET_KEY est obligatoire. "
        "Voir .env.example."
    )

DEBUG = _get_bool_env("DEBUG", default=False)

ALLOWED_HOSTS = _get_list_env("ALLOWED_HOSTS", "localhost,127.0.0.1")


# --- Applications -------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# --- Base de données ------------------------------------------------------
# DATABASE_URL est fournie par Render (Neon/PostgreSQL) en production.
# En local, à défaut, on retombe sur un SQLite pour démarrer rapidement.

DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{BASE_DIR / 'db.sqlite3'}"

DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        ssl_require=_get_bool_env("DATABASE_SSL_REQUIRE", default=not DEBUG),
    )
}


# --- Validation des mots de passe ------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# --- Internationalisation ---------------------------------------------

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = os.environ.get("TIME_ZONE", "Africa/Lome")
USE_I18N = True
USE_TZ = True


# --- Fichiers statiques (WhiteNoise) ------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


# --- CORS ----------------------------------------------------------------
# Le front (React/Vite en local, Cloudflare Pages en production) appelle
# cette API depuis une autre origine.

CORS_ALLOWED_ORIGINS = _get_list_env(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
CORS_ALLOW_CREDENTIALS = _get_bool_env("CORS_ALLOW_CREDENTIALS", default=True)


# --- Django REST Framework ------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Sécurité en production ------------------------------------------------

if not DEBUG:
    SECURE_SSL_REDIRECT = _get_bool_env("SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
