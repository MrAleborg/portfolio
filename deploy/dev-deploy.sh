#!/bin/sh
# Deploy a dev environment (Django runserver + Vite) to a LAN box with Docker,
# e.g. a Raspberry Pi. The site is then on http://<host>:8080.
#   deploy/dev-deploy.sh [<ip-or-hostname> <user>]
# The box's address, user and hostnames come from deploy/.env.dev (see
# .env.dev.example, never committed); arguments override them.
# Copies frontend/ and backend/ (with the local db.sqlite3, which replaces the
# remote one) to ~/portfolio-dev and restarts the containers, which reinstall
# the dependencies. Stop it with: ssh <user>@<host> 'cd ~/portfolio-dev && docker compose down'
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

# No rsync on the Pi: stream a tarball. Files deleted locally stay on the box.
tar czf - \
    --exclude=node_modules --exclude=dist --exclude=coverage \
    --exclude=__pycache__ --exclude=.pytest_cache --exclude=.venv \
    --exclude=backend/.env \
    frontend backend \
    | ssh "$TARGET" 'mkdir -p ~/portfolio-dev && tar xzf - -C ~/portfolio-dev'
scp -q deploy/compose.dev.yml "$TARGET:portfolio-dev/compose.yml"
ssh "$TARGET" "cd ~/portfolio-dev && DEV_HOST='$HOST' DEV_ALLOWED_HOSTS='${DEV_ALLOWED_HOSTS:-}' docker compose up -d --force-recreate"

echo "Installing dependencies, then up on http://$HOST:8080"
echo "Logs: ssh $TARGET 'cd ~/portfolio-dev && docker compose logs -f'"
