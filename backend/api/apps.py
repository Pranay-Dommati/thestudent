from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Self-ping was previously used to prevent Render Free tier from spinning
        # down after 15 minutes of inactivity. We are now on Render Standard plan
        # which runs 24/7 and never spins down — so self-ping is not needed and
        # has been removed to reduce unnecessary server load.
        pass
