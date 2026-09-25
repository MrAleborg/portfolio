# Deployment

The backend runs on a VPS with Docker Compose. [Caddy](https://caddyserver.com/)
takes the HTTPS traffic and passes it to gunicorn, which runs Django. The
database is a SQLite file on a Docker volume. Every push to `main` that passes
CI is deployed by GitHub Actions.

```mermaid
flowchart LR
    Browser -- "HTTPS :443" --> Caddy
    subgraph VPS [VPS, Docker Compose]
        Caddy -- "HTTP :8000" --> Backend["backend<br>gunicorn + Django"]
        Backend --> DB[("db-data volume<br>/data/db.sqlite3")]
    end
```

| File | Role |
|---|---|
| [`backend/Dockerfile`](../Dockerfile) | Backend image: dependencies, collected static files, non-root user |
| [`backend/docker-entrypoint.sh`](../docker-entrypoint.sh) | Applies migrations, then starts gunicorn |
| [`deploy/compose.yml`](../../deploy/compose.yml) | The stack: `backend` and `caddy` |
| [`deploy/Caddyfile`](../../deploy/Caddyfile) | Domain and reverse proxy. Caddy gets and renews the certificate |
| [`deploy/.env.example`](../../deploy/.env.example) | Production settings template |
| [`deploy/backup.sh`](../../deploy/backup.sh) | Database backup, run from cron |
| [`backend-deploy.yml`](../../.github/workflows/backend-deploy.yml) | Builds, pushes and deploys the image |

On the server, everything lives in `/opt/portfolio/`: the three files from
`deploy/` (copied by each deploy) and `.env` (written by hand, never copied).

## Settings

Django reads its settings from the environment
([`settings.py`](../portfolio/settings.py)). In production they come from
`/opt/portfolio/.env`; see [`deploy/.env.example`](../../deploy/.env.example).

| Variable | Production value | Notes |
|---|---|---|
| `API_DOMAIN` | `api.example.com` | Read by Caddy, not Django |
| `SECRET_KEY` | long random string | `python3 -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` | Also turns on the HTTPS settings below |
| `ALLOWED_HOSTS` | `api.example.com,localhost` | `localhost` is for the container health check |
| `CSRF_TRUSTED_ORIGINS` | `https://api.example.com` | Needed to log into `/admin/` |
| `CORS_ALLOWED_ORIGINS` | `https://example.com` | Where the frontend runs |
| `DATABASE_URL` | `sqlite:////data/db.sqlite3` | Four slashes: absolute path |
| `EMAIL_URL` | `smtp+tls://user:password@smtp.example.com:587` | `smtp+ssl://…:465` also works. URL-encode `@` and `:` in credentials |
| `DEFAULT_FROM_EMAIL`, `SERVER_EMAIL` | `portfolio@example.com` | Sender addresses |
| `ADMINS` | `you@example.com` | Receive server error reports by email |
| `SECURE_HSTS_SECONDS` | `3600`, later `31536000` | See [HTTPS](#https) |
| `SECURE_SSL_REDIRECT` | default `True` | Only for testing without HTTPS |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | default `True` | |

When `DEBUG` is off, Django redirects HTTP to HTTPS, marks cookies secure and
sends an HSTS header. It trusts the `X-Forwarded-Proto` header that Caddy sets,
since Caddy terminates TLS. Warnings and errors are logged to stdout.

## One-time server setup

Any small VPS works (1–2 vCPU, 2 GB RAM). These steps assume Ubuntu 24.04 and
a domain whose DNS you control.

### 1. DNS

Create an `A` record (and `AAAA` for IPv6) for `api.example.com` pointing to the
server's IP. Caddy needs it to get the certificate.

### 2. Firewall

Use both layers:

- **The provider's firewall** (in its web console): allow inbound TCP 22, 80,
  443 and UDP 443 (HTTP/3) only.
- **ufw** on the server:

  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 80,443/tcp
  sudo ufw allow 443/udp
  sudo ufw enable
  ```

Docker writes its own iptables rules, so **a port published by a container
bypasses ufw**. That is why only Caddy has `ports:` in `compose.yml`. The
backend is reachable only on the compose network. Don't add `ports:` to it.

### 3. Users and SSH

As root, create a `deploy` user that can log in with your key:

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
passwd deploy                      # for sudo
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

Check that `ssh deploy@<server>` works, then turn off password and root logins:

```bash
printf 'PasswordAuthentication no\nPermitRootLogin no\n' | sudo tee /etc/ssh/sshd_config.d/hardening.conf
sudo systemctl reload ssh
```

Install security updates automatically:

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy     # log out and in again
sudo install -d -o deploy -g deploy /opt/portfolio
```

Being in the `docker` group is as powerful as root. Protect the `deploy`
user's keys accordingly.

### 5. Production settings

Copy [`deploy/.env.example`](../../deploy/.env.example) to
`/opt/portfolio/.env`, fill it in, and make it private:

```bash
chmod 600 /opt/portfolio/.env
```

For `EMAIL_URL`, use any SMTP provider: a transactional service (Brevo,
Mailjet...), your domain's mailbox, or a Gmail app password.

### 6. GitHub

In the repository settings:

1. **Environments** → create `production` (optionally require a review before
   each deploy).
2. **Secrets** (repository or `production` environment):

   | Secret | Value |
   |---|---|
   | `VPS_HOST` | Server IP or host name |
   | `VPS_USER` | `deploy` |
   | `VPS_SSH_KEY` | Private key used by Actions (see below) |
   | `VPS_KNOWN_HOSTS` | Output of `ssh-keyscan -H <server>` |

3. **Variables** → `API_DOMAIN` = `api.example.com` (used for the smoke test).

Generate a key used only for deploys, and authorize it on the server:

```bash
ssh-keygen -t ed25519 -f portfolio-deploy -N "" -C "github-actions-deploy"
ssh-copy-id -i portfolio-deploy.pub deploy@<server>
# VPS_SSH_KEY = contents of portfolio-deploy; then delete the local copy
```

### 7. First deploy

Run **Actions → Backend deploy → Run workflow**. The build job pushes
`ghcr.io/mraleborg/portfolio-backend`. The package is private at first, so the
server can't pull it yet. Do one of these:

- make the package public (GitHub → Packages → portfolio-backend → Package
  settings → Change visibility). The image holds no secrets: `.env` is
  excluded by [`.dockerignore`](../.dockerignore);
- or log in once on the server with a personal access token that has only
  `read:packages`: `docker login ghcr.io -u <github user>`.

Then run the workflow again. Once it is green, create the admin account:

```bash
cd /opt/portfolio
docker compose exec backend python manage.py createsuperuser
```

Never run `seed_demo`, `flush_demo` or `reset_demo` here
(see [demo_data.md](demo_data.md)).

### 8. Backups

```bash
crontab -e
# 0 3 * * * /opt/portfolio/backup.sh >> /opt/portfolio/backup.log 2>&1
```

`backup.sh` writes a compressed, consistent copy of the database to
`/opt/portfolio/backups/` and deletes copies older than 14 days
(`BACKUP_DIR` and `KEEP_DAYS` change that). A backup on the same disk doesn't
survive losing the server, so also copy that folder elsewhere (e.g. `rclone`
to object storage, or `rsync` to another machine).

## How a deploy works

[`backend-deploy.yml`](../../.github/workflows/backend-deploy.yml) runs when
[Backend CI](testing.md#continuous-integration) passes on a push to `main`
(CI runs when `backend/` or `deploy/` changes), or by hand from the Actions
tab.

1. **build**: builds the image from `backend/` and pushes it to GHCR, tagged
   `sha-<commit>` and `latest`.
2. **deploy**: copies `compose.yml`, `Caddyfile` and `backup.sh` to
   `/opt/portfolio/`, then over SSH runs `docker compose pull backend` and
   `docker compose up -d --wait` with `TAG=sha-<commit>`. `--wait` fails the
   job if the new container doesn't pass its health check.
3. **Smoke test**: `curl` on `https://$API_DOMAIN/api/v1/experience/`.

The container applies migrations when it starts, before gunicorn.

## Operations

All from `/opt/portfolio` on the server.

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f backend` (or `caddy`) |
| Django shell | `docker compose exec backend python manage.py shell` |
| Restart | `docker compose restart backend` |
| Change a setting | edit `.env`, then `docker compose up -d` |

### Rollback

Every deploy keeps its image tag in GHCR. To go back to an earlier commit:

```bash
TAG=sha-<commit> docker compose up -d --wait
```

The next deploy from `main` replaces it. If the bad version had applied a
migration, restore a backup, or roll the migration back first with
`docker compose exec backend python manage.py migrate <app> <previous migration>`.

### Restore a backup

Stop the backend, then write the backup over the database from a one-off
container that mounts the same volume:

```bash
docker compose stop backend
docker compose run --rm --no-deps -u root -v "$PWD/backups:/backups:ro" \
  --entrypoint sh backend -c '
    gunzip -c /backups/db-<date>.sqlite3.gz > /data/db.sqlite3 &&
    rm -f /data/db.sqlite3-wal /data/db.sqlite3-shm &&
    chown app:app /data/db.sqlite3'
docker compose start backend
```

Deleting the `-wal` and `-shm` files stops SQLite from replaying the old
write-ahead log onto the restored file.

## HTTPS

Caddy gets a Let's Encrypt certificate for `API_DOMAIN` the first time it
starts and renews it by itself. The certificates are kept in the `caddy-data`
volume, so don't delete it.

HSTS tells browsers to use HTTPS only, for `SECURE_HSTS_SECONDS`. It starts at
one hour so a mistake is quick to undo. Once the site has run fine over HTTPS
for a while, raise it to a year (`31536000`). HSTS preload is not enabled: it
means submitting the domain to browser vendors, which takes months to undo.

## Trying the stack locally

```bash
docker build -t ghcr.io/mraleborg/portfolio-backend:local backend/
cp deploy/compose.yml deploy/Caddyfile /some/tmp/dir/
# In that dir: a .env from deploy/.env.example with API_DOMAIN=localhost,
# ALLOWED_HOSTS=localhost, TAG=local, EMAIL_URL=consolemail://
docker compose up -d
curl -k https://localhost/api/v1/experience/
```

Caddy serves `localhost` with its own local certificate, hence `-k`. If ports
80/443 are busy, remap them in a `compose.override.yml` with `ports: !override`.

## Adding the frontend later

The frontend build is static files, so it needs no container of its own at
runtime: Caddy can serve it. Two layouts work:

- **One domain** (simplest for the browser): `example.com` serves the frontend,
  and `example.com/api/*` and `/admin/*` go to the backend. There are no
  cross-origin requests, so CORS isn't needed.
- **Two domains**: `example.com` for the frontend and `api.example.com` for
  the API, with `CORS_ALLOWED_ORIGINS=https://example.com`. This is the
  current setup, plus one more Caddy site block.
