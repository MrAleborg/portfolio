#!/bin/sh
# Back up the SQLite database to $BACKUP_DIR and delete backups older than
# $KEEP_DAYS days. Run from cron on the server, e.g. every night at 3:00:
#   0 3 * * * /opt/portfolio/backup.sh >> /opt/portfolio/backup.log 2>&1
# Copy $BACKUP_DIR off the server too (rclone, rsync...): a backup on the
# same disk doesn't survive losing the server.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/opt/portfolio/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

cd "$(dirname "$0")"
mkdir -p "$BACKUP_DIR"
target="$BACKUP_DIR/db-$(date +%Y-%m-%d-%H%M).sqlite3"

# SQLite's backup API gives a consistent copy while the app is running.
docker compose exec -T backend python -c "
import sqlite3
source = sqlite3.connect('/data/db.sqlite3')
backup = sqlite3.connect('/data/backup.sqlite3')
source.backup(backup)
backup.close()
"
docker compose cp backend:/data/backup.sqlite3 "$target"
docker compose exec -T backend rm /data/backup.sqlite3
gzip "$target"

find "$BACKUP_DIR" -name 'db-*.sqlite3.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Iseconds) Backed up to $target.gz"
