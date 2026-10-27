#!/usr/bin/env bash
# Writes what's needed to rebuild production into $1: the database, the uploaded
# images and the .env (its APP_SECRET decrypts the 2FA secrets in the database).
# Called by ~/Code/production/homelab-backup/backup.sh.
set -euo pipefail
out="$1"
cd "$(dirname "$0")/.."

docker compose -p devprofile exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$out/database.dump"
docker compose -p devprofile exec -T postgres pg_restore --list < "$out/database.dump" > /dev/null

docker run --rm -v devprofile_uploads:/data:ro alpine tar -C /data -cf - . > "$out/uploads.tar"
cp .env "$out/env"
