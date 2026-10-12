#!/usr/bin/env bash
# Daily backup of the BoaSorte PostgreSQL database on the VPS (spec 001, plan > Backup).
#
# Runs pg_dump inside the Dokploy-managed Postgres container, using that container's own POSTGRES_* variables,
# so no credentials live in this script. Keeps the last KEEP_DAILY daily dumps and, from Sundays, KEEP_WEEKLY weekly
# ones. Optionally copies everything off the VPS with rclone.
#
# Environment:
#   CONTAINER_FILTER  required  part of the Postgres container name (docker ps --filter name=...)
#   BACKUP_DIR        default /var/backups/boasorte
#   KEEP_DAILY        default 7
#   KEEP_WEEKLY       default 4
#   RCLONE_REMOTE     optional  e.g. "b2:boasorte-backups" — copies BACKUP_DIR off-site after each run
set -euo pipefail

CONTAINER_FILTER="${CONTAINER_FILTER:?set CONTAINER_FILTER to (part of) the Postgres container name}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/boasorte}"
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

container="$(docker ps --filter "name=${CONTAINER_FILTER}" --filter status=running --format '{{.Names}}' | head -n 1)"
if [ -z "$container" ]; then
  log "ERROR no running container matches '${CONTAINER_FILTER}'"
  exit 1
fi

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"
chmod 700 "$BACKUP_DIR"

file="$BACKUP_DIR/daily/boasorte-$(date -u +%Y%m%dT%H%M%SZ).dump"
partial="$file.partial"
trap 'rm -f "$partial"' EXIT

docker exec "$container" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' > "$partial"

# A dump that pg_restore cannot list is not a backup.
docker exec -i "$container" pg_restore --list < "$partial" > /dev/null
mv "$partial" "$file"
chmod 600 "$file"

if [ "$(date -u +%u)" = "7" ]; then
  cp -p "$file" "$BACKUP_DIR/weekly/"
fi

prune() { # <dir> <keep>: delete all but the newest <keep> dumps; an empty dir is fine
  local files
  mapfile -t files < <(ls -1t "$1"/boasorte-*.dump 2>/dev/null || true)
  if [ "${#files[@]}" -gt "$2" ]; then
    rm -f -- "${files[@]:$2}"
  fi
}
prune "$BACKUP_DIR/daily" "$KEEP_DAILY"
prune "$BACKUP_DIR/weekly" "$KEEP_WEEKLY"

if [ -n "$RCLONE_REMOTE" ]; then
  rclone sync "$BACKUP_DIR" "$RCLONE_REMOTE"
  log "copied off-site to $RCLONE_REMOTE"
fi

log "OK $file ($(du -h "$file" | cut -f1))"
