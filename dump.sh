#!/usr/bin/env bash
set -euo pipefail

# Dump PostgreSQL database into db_backup.dump in custom format.
# Supports two modes:
# 1) Docker container named 'studentshub_postgres'
# 2) Local pg_dump on host

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ -f ./.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
fi

DB_NAME=${DB_NAME:-studentshub_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

OUTPUT_FILE="db_backup.dump"

echo "[dump] Target DB: $DB_NAME (user=$DB_USER host=$DB_HOST port=$DB_PORT)"

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q '^studentshub_postgres$'; then
  echo "[dump] Detected Docker container 'studentshub_postgres'. Dumping inside container..."
  docker exec -e PGPASSWORD="$DB_PASSWORD" studentshub_postgres \
    pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f /tmp/db_backup.dump

  docker cp studentshub_postgres:/tmp/db_backup.dump "$OUTPUT_FILE"
  docker exec studentshub_postgres rm -f /tmp/db_backup.dump >/dev/null 2>&1 || true
else
  echo "[dump] Using local pg_dump (ensure PostgreSQL client tools are installed)..."
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$DB_NAME" -F c -f "$OUTPUT_FILE"
fi

echo "[dump] Wrote $OUTPUT_FILE (commit and push this file)."
