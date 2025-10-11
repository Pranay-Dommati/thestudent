#!/usr/bin/env python
"""
Minimal connectivity check to the configured Django DATABASES['default'].
Reads env via backend.settings (which already loads .env files), then tries a simple SELECT 1
and prints server/version info. This avoids importing app models.
"""
import os
import sys

# Ensure project root and backend are on path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(ROOT, 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django  # noqa: E402
from django.db import connection  # noqa: E402
from django.conf import settings  # noqa: E402

def main():
    django.setup()
    db = settings.DATABASES['default']
    print('Attempting DB connection with:')
    print(f"  ENGINE = {db.get('ENGINE')}\n  HOST   = {db.get('HOST')}\n  PORT   = {db.get('PORT')}\n  NAME   = {db.get('NAME')}\n  USER   = {db.get('USER')}")
    try:
        with connection.cursor() as cur:
            cur.execute('SELECT 1')
            one = cur.fetchone()
            cur.execute('SELECT VERSION()')
            version = cur.fetchone()
        print(f"\n✅ Connected. SELECT 1 -> {one[0]}, Server VERSION -> {version[0]}")
    except Exception as e:
        print(f"\n❌ Connection failed: {type(e).__name__}: {e}")
        # Common hints
        print("\nHints:")
        print("- Check .env DB_HOST is your Hostinger MySQL hostname (not 'localhost').")
        print("- Add your public IP to Hostinger > Remote MySQL.")
        print("- If port 3306 is blocked, use an SSH tunnel and set DB_HOST=127.0.0.1, DB_PORT=<local_tunnel_port>.")
        print("- If SSL is required by your host, set DB_SSL_REQUIRE=true in .env.")

if __name__ == '__main__':
    main()
