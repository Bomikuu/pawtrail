import os
from datetime import timedelta
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("PAWTRAIL_PLATFORM_DATA", BASE_DIR / ".data"))
DATA_DIR.mkdir(parents=True, exist_ok=True, mode=0o700)
DEBUG = os.environ.get("PAWTRAIL_PRODUCTION") != "1"
COMMUNITY_FIXTURES_VISIBLE = DEBUG and os.environ.get("PAWTRAIL_COMMUNITY_FIXTURES", "1") == "1"
SECRET_KEY = os.environ.get("PAWTRAIL_PLATFORM_SECRET", "")
if not SECRET_KEY and DEBUG:
    import secrets
    secret_file = DATA_DIR / "secret"
    try:
        fd = os.open(secret_file, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(secrets.token_hex(48))
    except FileExistsError:
        pass
    SECRET_KEY = secret_file.read_text().strip()
if len(SECRET_KEY) < 32:
    raise RuntimeError("PAWTRAIL_PLATFORM_SECRET must contain at least 32 characters")
ALLOWED_HOSTS = os.environ.get("PAWTRAIL_PLATFORM_HOSTS", "localhost,127.0.0.1").split(",")
INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "rest_framework", "rest_framework_simplejwt.token_blacklist",
    "accounts", "media", "animals", "observations", "identity", "rewards", "social.apps.SocialConfig",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware", "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware", "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware", "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
AUTH_USER_MODEL = "accounts.User"
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request",
              "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
DATABASES = {"default": dj_database_url.parse(os.environ["DATABASE_URL"], conn_max_age=60) if os.environ.get("DATABASE_URL") else {
    "ENGINE": "django.db.backends.sqlite3", "NAME": DATA_DIR / "platform.sqlite3", "OPTIONS": {"timeout": 30, "transaction_mode": "IMMEDIATE"}}}
if DATABASES["default"]["ENGINE"].endswith("postgresql"):
    DATABASES["default"]["ENGINE"] = "django.contrib.gis.db.backends.postgis"
if not DEBUG and not os.environ.get("DATABASE_URL"):
    raise RuntimeError("Production requires a PostgreSQL/PostGIS DATABASE_URL")
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "EXCEPTION_HANDLER": "config.errors.exception_handler",
    "DEFAULT_THROTTLE_CLASSES": ["config.throttles.BrowseAnonThrottle", "config.throttles.BrowseUserThrottle",
                                 "config.throttles.MutationAnonThrottle", "config.throttles.MutationUserThrottle"],
    "DEFAULT_THROTTLE_RATES": {"anon": "30/minute", "user": "120/minute", "capture": "20/hour",
                               "anon_read": os.environ.get("PAWTRAIL_ANON_READ_RATE", "600/minute"),
                               "user_read": os.environ.get("PAWTRAIL_USER_READ_RATE", "1200/minute")},
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=15), "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
              "ROTATE_REFRESH_TOKENS": True, "BLACKLIST_AFTER_ROTATION": True}
LANGUAGE_CODE = "en"
TIME_ZONE = "UTC"
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = DATA_DIR / "static"
MEDIA_ROOT = DATA_DIR / "media"
MEDIA_ROOT.mkdir(exist_ok=True, mode=0o700)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
APPEND_SLASH = False
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024
MODEL_DIR = Path(os.environ.get("PAWTRAIL_MODEL_DIR", DATA_DIR / "models"))
CELERY_BROKER_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/2")
CELERY_TASK_IGNORE_RESULT = True
CELERY_TASK_SOFT_TIME_LIMIT = 90
CELERY_TASK_TIME_LIMIT = 120
CELERY_WORKER_CONCURRENCY = 1
ANALYSIS_QUEUE = os.environ.get("PAWTRAIL_ANALYSIS_QUEUE", "database")
if not DEBUG and (ANALYSIS_QUEUE != "celery" or not os.environ.get("REDIS_URL")):
    raise RuntimeError("Production requires PAWTRAIL_ANALYSIS_QUEUE=celery and REDIS_URL")
if os.environ.get("REDIS_URL"):
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": os.environ["REDIS_URL"]}}
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_BEAT_SCHEDULE = {"recover-analysis-queue": {"task": "pawtrail.recover", "schedule": 60.0}}
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
X_FRAME_OPTIONS = "DENY"

# Pixelcore Studio engine, embedded with PawTrail-owned authorization and storage.
INSTALLED_APPS += ['website_builder', 'landing_pages.apps.LandingPagesConfig']
WEBSITE_BUILDER_AUTHORIZE = 'landing_pages.hooks.authorize'
WEBSITE_BUILDER_RESOLVE_DATA = 'landing_pages.hooks.resolve_data'
WEBSITE_BUILDER_CAPABILITIES = 'landing_pages.hooks.capabilities'
WEBSITE_BUILDER_UPLOAD_MEDIA = 'landing_pages.hooks.upload_media'
