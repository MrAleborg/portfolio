#!/bin/sh
# Deploy a dev environment (Django runserver + Vite) to a LAN box with Docker,
# e.g. a Raspberry Pi. The site is then on http://<host>:8080.
#   deploy/dev-deploy.sh [<ip-or-hostname> <user>]
# The box's address, user and hostnames come from deploy/.env.dev (see
# .env.dev.example, never committed); arguments override them.
# Replaces frontend/ and backend/ in ~/portfolio-dev with the local ones and
# restarts the containers, which reinstall the dependencies. The box's
# db.sqlite3 is kept, unless there is a local one: it then replaces it.
# The dev-deploy workflow runs it for each push to a branch other than main,
# with DEV_HOST, DEV_USER and DEV_ALLOWED_HOSTS set in the environment.
# Stop it with: ssh <user>@<host> 'cd ~/portfolio-dev && docker compose down'
set -eu

cd "$(dirname "$0")/.."

if [ -f deploy/.env.dev ]; then
    . deploy/.env.dev
fi
HOST="${1:-${DEV_HOST:-}}"
USER_NAME="${2:-${DEV_USER:-}}"
if [ -z "$HOST" ] || [ -z "$USER_NAME" ]; then
    echo "usage: $0 <ip-or-hostname> <user>, or set them in deploy/.env.dev" >&2
    exit 1
fi
TARGET="$USER_NAME@$HOST"

# Empty the old frontend/ and backend/ first, so files deleted locally (or
# absent from the branch) don't stay on the box. Keep the box's backend/.env and
# its database, unless a local db.sqlite3 replaces it: then drop the old one's
# -wal and -shm too, or SQLite would replay them onto the new file. The
# containers create files as root (__pycache__, the database...): delete from
# a container, with the image the backend already uses. The directories are
# created first as the user, so the tarball can be extracted into them. Then
# stream a tarball (no rsync on the Pi).
if [ -f backend/db.sqlite3 ]; then KEEP=.env; else KEEP='db.sqlite3*'; fi
ssh "$TARGET" "KEEP='$KEEP' sh -s" <<'EOF'
set -eu
mkdir -p ~/portfolio-dev/frontend ~/portfolio-dev/backend
cd ~/portfolio-dev
# </dev/null: docker would otherwise read this script from stdin.
if [ -f compose.yml ]; then docker compose stop </dev/null; fi
docker run --rm -e KEEP -v "$PWD:/w" python:3.12-slim </dev/null \
    sh -c 'find /w/frontend /w/backend -mindepth 1 ! -path /w/backend/.env ! -path "/w/backend/$KEEP" -delete'
EOF
tar czf - \
    --exclude=node_modules --exclude=dist --exclude=coverage \
    --exclude=__pycache__ --exclude=.pytest_cache --exclude=.venv \
    --exclude=backend/.env \
    frontend backend \
    | ssh "$TARGET" 'tar xzf - -C ~/portfolio-dev'
scp -q deploy/compose.dev.yml "$TARGET:portfolio-dev/compose.yml"
ssh "$TARGET" "cd ~/portfolio-dev && DEV_HOST='$HOST' DEV_ALLOWED_HOSTS='${DEV_ALLOWED_HOSTS:-}' docker compose up -d --force-recreate"

echo "Installing dependencies, then up on http://$HOST:8080"
echo "Logs: ssh $TARGET 'cd ~/portfolio-dev && docker compose logs -f'"
