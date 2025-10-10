#!/usr/bin/env python3
"""
Export data from a legacy PostgreSQL database (via env PG_* vars) as Django
JSON fixtures that can be imported into the current MySQL-backed instance.

Usage:
  # Set PG_* env vars to point to the old Postgres (container/host)
  # Examples (Git Bash on Windows):
  #   export PG_HOST=127.0.0.1
  #   export PG_PORT=5432
  #   export PG_USER=postgres
  #   export PG_PASSWORD=yourpass
  #   export PG_DB=studentshub_db
  # Then run:
  #   .venv/Scripts/python.exe export_from_postgres.py

Outputs:
  - backend/fixtures_export/
      - users.json
      - courses.json
      - feedback.json
      - newsletter.json
      - pro_learning.json
      - all_data.json (combined, excluding auth.permission, contenttypes, sessions, admin.logentry)
"""
import os
import sys
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent
BACKEND = REPO / 'backend'
FIXTURES_DIR = BACKEND / 'fixtures_export'

ENV = os.environ.copy()
ENV['DJANGO_SETTINGS_MODULE'] = 'backend.settings_postgres_export'
# Force UTF-8 to avoid Windows charmap errors during serialization/logging
ENV.setdefault('PYTHONIOENCODING', 'utf-8')
ENV.setdefault('PYTHONUTF8', '1')
ENV.setdefault('LANG', 'C.UTF-8')
ENV.setdefault('LC_ALL', 'C.UTF-8')

APPS = [
    'authentication',
    'courses',
    'feedback',
    'newsletter',
    'tracking',
]

EXCLUDES = [
    'contenttypes',
    'auth.permission',
    'admin.logentry',
    'sessions',
]

def run_manage(args):
    return subprocess.run(
        [sys.executable, 'manage.py'] + args,
        cwd=str(BACKEND),
        env=ENV,
        capture_output=True,
        text=True,
        shell=False,
    )


def main():
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

    # Per-app dumps
    for app in APPS:
        print(f"[export] Dumping app: {app}")
        out_file = FIXTURES_DIR / f"{app}.json"
        res = run_manage(['dumpdata', app, '--indent', '2', '--output', str(out_file)])
        if res.returncode != 0:
            print(f"[export] WARNING: dumpdata for {app} failed:\n{res.stderr.strip()}")
        else:
            sz = out_file.stat().st_size if out_file.exists() else 0
            print(f"[export] Wrote {out_file.name} ({sz} bytes)")

    # Combined dump excluding system apps
    print("[export] Dumping combined dataset (excluding system apps)...")
    args = ['dumpdata', '--indent', '2', '--output', str(FIXTURES_DIR / 'all_data.json')]
    for ex in EXCLUDES:
        args.extend(['--exclude', ex])
    res = run_manage(args)
    if res.returncode != 0:
        print(f"[export] ERROR: combined dump failed:\n{res.stderr.strip()}")
        return 1
    else:
        fn = FIXTURES_DIR / 'all_data.json'
        print(f"[export] Wrote {fn.name} ({fn.stat().st_size} bytes)")

    print("\n[export] Done. To import into your current MySQL DB:")
    print("  1) Ensure your Django is pointed at MySQL (current settings)")
    print("  2) Run: .venv/Scripts/python.exe backend/manage.py loaddata fixtures_export/all_data.json")
    print("     Or load specific apps: users.json, courses.json, etc.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
