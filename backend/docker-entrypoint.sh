#!/bin/sh
# Apply migrations, then replace this shell with gunicorn so it gets the stop
# signals.
set -e

python manage.py migrate --noinput

exec gunicorn portfolio.wsgi:application \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    "$@"
