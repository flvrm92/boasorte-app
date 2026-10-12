#!/usr/bin/env bash
# Restores a dump made by pg-backup.sh into the BoaSorte database. DESTRUCTIVE: replaces the current data.
#
# Usage: CONTAINER_FILTER=<postgres container> ./pg-restore.sh <file.dump>
# Stop the API first (Dokploy: stop the "api" application) so nothing writes during the restore.
# Set FORCE=1 to skip the confirmation prompt (e.g. in a restore drill script).
set -euo pipefail

CONTAINER_FILTER="${CONTAINER_FILTER:?set CONTAINER_FILTER to (part of) the Postgres container name}"
dump="${1:?usage: pg-restore.sh <file.dump>}"
[ -f "$dump" ] || { echo "file not found: $dump" >&2; exit 1; }

container="$(docker ps --filter "name=${CONTAINER_FILTER}" --filter status=running --format '{{.Names}}' | head -n 1)"
[ -n "$container" ] || { echo "no running container matches '${CONTAINER_FILTER}'" >&2; exit 1; }

if [ "${FORCE:-0}" != "1" ]; then
  read -r -p "Replace the database in '$container' with '$dump'? Type 'restore' to continue: " answer
  [ "$answer" = "restore" ] || { echo "aborted"; exit 1; }
fi

docker exec -i "$container" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction' < "$dump"
echo "restored $dump into $container"
