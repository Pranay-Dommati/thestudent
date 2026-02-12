import threading
import requests
import time
import os
from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Prevent the thread from starting twice during development auto-reload
        # and only run if we are on the production server (RENDER env var is set on Render)
        if os.environ.get('RUN_MAIN') != 'true' and os.environ.get('RENDER'):
            threading.Thread(target=self.ping_self, daemon=True).start()

    def ping_self(self):
        # Give the server 30 seconds to fully boot before the first ping
        time.sleep(30)
        # Use environment variable for flexibility, default to the known Render URL
        url = os.environ.get('SELF_PING_URL', "https://easylearnova-backend.onrender.com/ping/")
        
        while True:
            try:
                # Set a timeout to prevent hanging indefinitely
                response = requests.get(url, timeout=10)
                # Optional: Add a simple log to verify it's working
                print(f"Self-ping success: {response.status_code}")
            except Exception as e:
                print(f"Self-ping failed: {e}")
            
            # Ping every 5 minutes (300 seconds)
            time.sleep(300)
