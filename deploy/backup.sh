#!/bin/sh
# Back up the SQLite database to $BACKUP_DIR as a dated, compressed file, and
# delete backups older than $KEEP_DAYS days. The one just made is never deleted.
# Run from cron on the server as the deploy user, e.g. every night at 3:00
# (sudo crontab -u deploy -e). Each deploy runs it too, before the migrations.
# With a MAILTO line, cron emails whatever the script prints on stderr:
#   MAILTO=you@example.com
#   0 3 * * * /opt/portfolio/backup.sh >> /opt/portfolio/backup.log
# Copy $BACKUP_DIR off the server too (rclone, rsync...): a backup on the
# same disk doesn't survive losing the server.
set -eu
umask 077

BACKUP_DIR="${BACKUP_DIR:-/opt/portfolio/backups}"
KEEP_DAYS="${KEEP_DAYS:-180}"

cd "$(dirname "$0")"
mkdir -p "$BACKUP_DIR"
# umask doesn't cover a folder that already exists, nor the mode docker compose
# cp keeps from the container.
chmod 700 "$BACKUP_DIR"
copy="$BACKUP_DIR/.new.sqlite3"

# SQLite's backup API gives a consistent copy while the app is running.
docker compose exec -T backend python -c "
import sqlite3
source = sqlite3.connect('/data/db.sqlite3')
backup = sqlite3.connect('/data/backup.sqlite3')
source.backup(backup)
backup.close()
"
docker compose cp backend:/data/backup.sqlite3 "$copy"
chmod 600 "$copy"
docker compose exec -T backend rm /data/backup.sqlite3

# The time is in the name, so a backup before a deploy doesn't replace the
# night's one.
file="$BACKUP_DIR/db-$(date +%Y-%m-%d-%H%M%S).sqlite3"
mv "$copy" "$file"
gzip "$file"
echo "$(date -Iseconds) Backed up to $file.gz"

find "$BACKUP_DIR" -name 'db-*.sqlite3.gz' -mtime +"$KEEP_DAYS" -delete
