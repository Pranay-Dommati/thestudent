#!/usr/bin/env bash
set -euo pipefail

# Restore PostgreSQL database from db_backup.dump in custom format.
# Supports:
# 1) Docker container named 'studentshub_postgres'
# 2) Local pg_restore on host

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f db_backup.dump ]]; then
  echo "[load] db_backup.dump not found in repo root. Aborting." >&2
  exit 1
fi

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
MAINT_DB=${MAINT_DB:-postgres}

echo "[load] Restoring to DB: $DB_NAME (user=$DB_USER host=$DB_HOST port=$DB_PORT)"

# Wrap docker to avoid Git Bash/MSYS path conversion on Windows
docker_cmd() {
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" docker "$@"
}

if command -v docker >/dev/null 2>&1 && docker_cmd ps --format '{{.Names}}' | grep -q '^studentshub_postgres$'; then
  echo "[load] Detected Docker container 'studentshub_postgres'. Restoring inside container..."
  docker_cmd cp db_backup.dump studentshub_postgres:/tmp/db_backup.dump

  # Wait for Postgres readiness inside the container
  docker_cmd exec studentshub_postgres bash -lc "until pg_isready -U '$DB_USER' -d '$MAINT_DB' -q; do echo '[load] waiting for postgres...'; sleep 1; done"

  # Use maintenance DB for --create restores, don't swallow errors
  # Drop target DB if it exists to avoid duplicate/constraint errors
  docker_cmd exec -e PGPASSWORD="$DB_PASSWORD" studentshub_postgres \
    psql -U "$DB_USER" -d "$MAINT_DB" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

  docker_cmd exec -e PGPASSWORD="$DB_PASSWORD" studentshub_postgres \
    pg_restore -U "$DB_USER" -d "$MAINT_DB" --create /tmp/db_backup.dump

  docker_cmd exec studentshub_postgres rm -f /tmp/db_backup.dump >/dev/null 2>&1 || true
else
  echo "[load] Using local pg_restore (ensure PostgreSQL client tools are installed)..."
  # Optionally wait for local Postgres if pg_isready exists
  if command -v pg_isready >/dev/null 2>&1; then
    until PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$MAINT_DB" -q; do
      echo "[load] waiting for postgres at $DB_HOST:$DB_PORT..."; sleep 1; done
  fi

  # Drop target DB if it exists
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$MAINT_DB" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

  PGPASSWORD="$DB_PASSWORD" pg_restore \
    -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$MAINT_DB" --create db_backup.dump
fi

echo "[load] Restore completed."

# Post-restore quick verification
echo "[load] Verifying presence of key tables and row counts..."

VERIFY_SQL="SELECT 'courses_engineeringcourse' AS table, COUNT(*) FROM courses_engineeringcourse UNION ALL SELECT 'courses_prolearningcourse', COUNT(*) FROM courses_prolearningcourse UNION ALL SELECT 'courses_lesson', COUNT(*) FROM courses_lesson;"

if command -v docker >/dev/null 2>&1 && docker_cmd ps --format '{{.Names}}' | grep -q '^studentshub_postgres$'; then
  docker_cmd exec -e PGPASSWORD="$DB_PASSWORD" studentshub_postgres \
    psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$VERIFY_SQL"
else
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$VERIFY_SQL"
fi
