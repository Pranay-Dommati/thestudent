#!/usr/bin/env bash
set -euo pipefail

# Dump MySQL database into db_backup.sql

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables if .env exists
if [[ -f ./.env ]]; then
  set -a
  source ./.env
  set +a
fi

DB_NAME=${DB_NAME:-studentshub_db}
DB_USER=${DB_USER:-studentshub_user}
DB_PASSWORD=${DB_PASSWORD:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

OUTPUT_FILE="db_backup.sql"

echo "[dump] Target DB: $DB_NAME (user=$DB_USER host=$DB_HOST port=$DB_PORT)"

# Wrap docker to avoid path conversion on Windows
docker_cmd() {
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" docker "$@"
}

# Check if Docker container exists
if command -v docker >/dev/null 2>&1 && docker_cmd ps --format '{{.Names}}' | grep -q '^studentshub_mysql$'; then
  echo "[dump] Detected Docker container 'studentshub_mysql'. Dumping inside container..."

  # Run mysqldump inside container and redirect to a temp file inside container
  docker_cmd exec studentshub_mysql bash -c "\
    mysqldump -u \"$DB_USER\" -p\"$DB_PASSWORD\" \
      --single-transaction \
      --no-tablespaces \
      --add-drop-table \
      --routines \
      --triggers \
      --events \
      --set-gtid-purged=OFF \
      \"$DB_NAME\" > /tmp/db_backup.sql \
  "

  # Copy the full dump file from container to host
  docker_cmd cp studentshub_mysql:/tmp/db_backup.sql "$OUTPUT_FILE"

  echo "[dump] Dump completed inside container"
else
  echo "[dump] Docker container not found, using local mysqldump..."
  mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
    --single-transaction \
    --no-tablespaces \
    --add-drop-table \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "$DB_NAME" > "$OUTPUT_FILE"
fi

echo "[dump] Wrote $OUTPUT_FILE (commit and push this file)."
echo "[dump] File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
