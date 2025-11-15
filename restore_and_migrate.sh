#!/usr/bin/env bash
set -euo pipefail

# Quick script to restore database and run migrations in one command
# Usage: ./restore_and_migrate.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Database Restore & Migration Script                          ║"
echo "║  This will: 1) Restore DB  2) Run Migrations  3) Verify       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if db_backup.sql exists
if [[ ! -f db_backup.sql ]]; then
  echo "❌ Error: db_backup.sql not found!"
  echo ""
  echo "Solutions:"
  echo "  1. Pull latest code: git pull origin pranay-maybe-final"
  echo "  2. Or create backup on another machine: ./dump.sh"
  exit 1
fi

# Step 1: Restore database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/3: Restoring Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./load.sh

if [[ $? -ne 0 ]]; then
  echo ""
  echo "❌ Database restore failed! Check errors above."
  exit 1
fi

# Step 2: Run migrations
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/3: Running Django Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend

# Check if virtual environment exists
if [[ -d ".venv" ]]; then
  echo "[migrate] Activating virtual environment..."
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows Git Bash
    source .venv/Scripts/activate
  else
    # Linux/Mac
    source .venv/bin/activate
  fi
fi

# Run migrations
echo "[migrate] Running: python manage.py migrate"
python manage.py migrate

if [[ $? -ne 0 ]]; then
  echo ""
  echo "❌ Migrations failed! Check errors above."
  exit 1
fi

# Step 3: Verify setup
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/3: Verifying Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Quick check
echo "[verify] Checking database connection..."
python manage.py check --database default

if [[ $? -eq 0 ]]; then
  echo ""
  echo "✅ SUCCESS! Database restored and migrations applied."
  echo ""
  echo "Next steps:"
  echo "  1. Start backend:  cd backend && python manage.py runserver"
  echo "  2. Start frontend: cd frontend && npm run dev"
  echo "  3. Open browser:   http://localhost:5173"
  echo ""
else
  echo ""
  echo "⚠️  Database check failed. Try running server manually:"
  echo "    cd backend && python manage.py runserver"
fi

cd ..
