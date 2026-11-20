#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${DB_NAME:-mdb_satubencana}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"

echo "→ Membuat DB ${DB_NAME} (abaikan error jika sudah ada)..."
psql -h "$DB_HOST" -p "$DB_PORT" -d postgres -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || true

echo "→ Menjalankan schema + seed..."
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$ROOT/scripts/sql/local_auth_schema.sql"

echo "→ Seed:"
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT email, role, display_name FROM app_users ORDER BY role;"
echo "Selesai. Pastikan .env.local AUTH_MODE=local dan DATABASE_URL mengarah ke DB ini."
