#!/bin/sh
# Back up the SQLite database to $BACKUP_DIR, unless it hasn't changed since the
# latest backup, and delete backups older than $KEEP_DAYS days. The latest
# backup is always kept, however old. Run from cron on the server as the deploy
# user, e.g. every night at 3:00 (sudo crontab -u deploy -e):
#   0 3 * * * /opt/portfolio/backup.sh >> /opt/portfolio/backup.log 2>&1
# Copy $BACKUP_DIR off the server too (rclone, rsync...): a backup on the
# same disk doesn't survive losing the server.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/opt/portfolio/backups}"
KEEP_DAYS="${KEEP_DAYS:-180}"

cd "$(dirname "$0")"
mkdir -p "$BACKUP_DIR"
copy="$BACKUP_DIR/.new.sqlite3"
# Names are dated, so the last one in name order is the latest.
latest=$(find "$BACKUP_DIR" -name 'db-*.sqlite3.gz' | sort | tail -n 1)

# SQLite's backup API gives a consistent copy while the app is running. Copies
# of an unchanged database are identical byte for byte.
docker compose exec -T backend python -c "
import sqlite3
source = sqlite3.connect('/data/db.sqlite3')
backup = sqlite3.connect('/data/backup.sqlite3')
source.backup(backup)
backup.close()
"
docker compose cp backend:/data/backup.sqlite3 "$copy"
docker compose exec -T backend rm /data/backup.sqlite3

if [ -n "$latest" ] && [ "$(gunzip -c "$latest" | sha256sum)" = "$(sha256sum < "$copy")" ]; then
    rm "$copy"
    echo "$(date -Iseconds) No change since $latest"
else
    latest="$BACKUP_DIR/db-$(date +%Y-%m-%d-%H%M%S).sqlite3"
    mv "$copy" "$latest"
    gzip "$latest"
    latest="$latest.gz"
    echo "$(date -Iseconds) Backed up to $latest"
fi

find "$BACKUP_DIR" -name 'db-*.sqlite3.gz' -mtime +"$KEEP_DAYS" ! -path "$latest" -delete
