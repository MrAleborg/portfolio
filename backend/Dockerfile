# syntax=docker/dockerfile:1

# Export the locked production dependencies, so the final image doesn't need pipenv.
FROM python:3.12-slim AS requirements
RUN pip install --no-cache-dir pipenv
WORKDIR /build
COPY Pipfile Pipfile.lock ./
RUN pipenv requirements --hash > requirements.txt


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Gunicorn worker count
    WEB_CONCURRENCY=3

WORKDIR /app

COPY --from=requirements /build/requirements.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

# /data holds the SQLite database, on a volume in production.
RUN useradd --system --create-home app \
    && mkdir /data \
    && chown app /data

COPY . .
# The key only exists for this command; the real one comes from the environment.
RUN SECRET_KEY=collectstatic-only python manage.py collectstatic --noinput

USER app
EXPOSE 8000

# Plain HTTP from inside the container: say it came through HTTPS to skip the
# redirect. "localhost" must be in ALLOWED_HOSTS.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen(urllib.request.Request('http://localhost:8000/api/v1/experience/', headers={'X-Forwarded-Proto': 'https'}), timeout=4)"]

ENTRYPOINT ["./docker-entrypoint.sh"]
