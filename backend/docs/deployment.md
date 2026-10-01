# Deployment

The backend and the frontend run on a VPS with Docker Compose. The server's own
[Caddy](https://caddyserver.com/), installed on the host and shared with other
sites, takes the HTTPS traffic and passes it to the containers, which listen on
`127.0.0.1` only:

- `api.example.com` goes to the backend: gunicorn running Django. The
  database is a SQLite file on a Docker volume.
- `example.com` goes to the frontend: nginx serving the React build. Its
  `/api/` paths go to the backend, so the site calls the API on its own
  domain. `www.example.com` redirects there.

Every push to `main` that passes CI is deployed by GitHub Actions: the backend
when `backend/` or `deploy/` changes, the frontend when `frontend/` changes.

```mermaid
flowchart LR
    Browser -- "HTTPS :443" --> Caddy["Caddy<br>(host service)"]
    subgraph VPS
        Caddy -- "api.example.com<br>HTTP 127.0.0.1:8000" --> Backend
        Caddy -- "example.com<br>HTTP 127.0.0.1:8080" --> Frontend
        Caddy -- "example.com/api/<br>HTTP 127.0.0.1:8000" --> Backend
        subgraph Compose [Docker Compose]
            Backend["backend<br>gunicorn + Django"] --> DB[("db-data volume<br>/data/db.sqlite3")]
            Frontend["frontend<br>nginx + React build"]
        end
    end
```

| File | Role |
|---|---|
| [`backend/Dockerfile`](../Dockerfile) | Backend image: dependencies, collected static files, non-root user |
| [`backend/docker-entrypoint.sh`](../docker-entrypoint.sh) | Applies migrations, then starts gunicorn |
| [`frontend/Dockerfile`](../../frontend/Dockerfile) | Frontend image: builds the site, serves it with nginx as a non-root user |
| [`frontend/nginx.conf`](../../frontend/nginx.conf) | Client-side routes and cache headers |
| [`deploy/compose.yml`](../../deploy/compose.yml) | The stack: the `backend` and `frontend` services, published on `127.0.0.1` |
| [`deploy/Caddyfile.example`](../../deploy/Caddyfile.example) | Site blocks to add to the server's Caddy config |
| [`deploy/.env.example`](../../deploy/.env.example) | Production settings template |
| [`deploy/backup.sh`](../../deploy/backup.sh) | Database backup, run from cron |
| [`deploy.yml`](../../.github/workflows/deploy.yml) | Builds and pushes both images, then deploys the stack |

On the server, the stack lives in `/opt/portfolio/`: `compose.yml` and
`backup.sh` (copied by each deploy) and `.env` (written by hand, never copied).
The Caddy config, `/etc/caddy/Caddyfile`, is edited by hand too, since other
sites share it.

## Settings

Django reads its settings from the environment
([`settings.py`](../portfolio/settings.py)). In production they come from
`/opt/portfolio/.env`; see [`deploy/.env.example`](../../deploy/.env.example).

| Variable | Production value | Notes |
|---|---|---|
| `BACKEND_PORT` | `8000` | Read by Compose: host port on `127.0.0.1`. Change it if 8000 is taken |
| `FRONTEND_PORT` | `8080` | Read by Compose: host port of the frontend on `127.0.0.1`. Change it if 8080 is taken |
| `SECRET_KEY` | long random string | `python3 -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` | Also turns on the HTTPS settings below |
| `ALLOWED_HOSTS` | `api.example.com,example.com,localhost` | `example.com` is for the site's API calls on `/api/`; `localhost` is for the container health check |
| `CSRF_TRUSTED_ORIGINS` | `https://api.example.com` | Needed to log into `/admin/` |
| `CORS_ALLOWED_ORIGINS` | `https://example.com` | Where the frontend runs |
| `DATABASE_URL` | `sqlite:////data/db.sqlite3` | Four slashes: absolute path |
| `EMAIL_URL` | `smtp+tls://contact%40example.com:password@smtp.example.com:587` | Sends the emails people receive. `smtp+ssl://…:465` also works. URL-encode `@` and `:` in credentials |
| `DEFAULT_FROM_EMAIL` | `contact@example.com` | Sender of those emails. Must match the `EMAIL_URL` account |
| `SERVER_EMAIL_URL` | `smtp+tls://logs%40example.com:password@smtp.example.com:587` | Sends the error reports. Defaults to `EMAIL_URL` |
| `SERVER_EMAIL` | `logs@example.com` | Sender of the error reports. Must match the `SERVER_EMAIL_URL` account |
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

Create `A` records (and `AAAA` for IPv6) for `api.example.com`,
`example.com` and `www.example.com` pointing to the server's IP. Caddy needs
them to get the certificates.

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
bypasses ufw**. That is why the backend is published on `127.0.0.1` only:
Caddy on the host can reach it, the internet can't. Keep the `127.0.0.1:` prefix
in `compose.yml`, and do the same for any other container on the server.

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

For `EMAIL_URL` and `SERVER_EMAIL_URL`, use any SMTP provider: a
transactional service (Brevo, Mailjet...), your domain's mailbox, or a Gmail
app password. Two URLs exist because an SMTP account can usually only send from
its own address: with Proton, for example, each address gets its own SMTP token
(Settings → IMAP/SMTP → SMTP tokens, server `smtp.protonmail.ch:587`). To test
the error reports once the backend runs:
`docker compose exec backend python manage.py sendtestemail --admins`.

Check that `BACKEND_PORT` and `FRONTEND_PORT` (default 8000 and 8080) are
free: `sudo ss -tlnp | grep -E ':(8000|8080) '`.

### 6. Caddy

Add the site blocks from
[`deploy/Caddyfile.example`](../../deploy/Caddyfile.example) to
`/etc/caddy/Caddyfile`, with your domains (and your ports if they aren't 8000
and 8080):

- `api.example.com` proxies to the backend.
- `example.com` proxies `/api/*` to the backend and everything else to the
  frontend.
- `www.example.com` redirects to `example.com`.

Then check and reload:

```bash
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

Until the first deploys, Caddy answers `502 Bad Gateway` for these domains:
the containers aren't running yet.

### 7. GitHub

In the repository settings:

1. **Environments** → create `Portfolio production` (the name the workflow uses) (optionally require a review before
   each deploy).
2. **Secrets** (repository or `Portfolio production` environment):

   | Secret | Value |
   |---|---|
   | `VPS_HOST` | Server IP or host name |
   | `VPS_USER` | `deploy` |
   | `VPS_SSH_KEY` | Private key used by Actions (see below) |
   | `VPS_KNOWN_HOSTS` | Output of `ssh-keyscan -H <server>` |

3. **Variables** → `API_DOMAIN` = `api.example.com` and `FRONTEND_DOMAIN` =
   `example.com` (used for the smoke tests).

Generate a key used only for deploys, and authorize it on the server:

```bash
ssh-keygen -t ed25519 -f portfolio-deploy -N "" -C "github-actions-deploy"
ssh-copy-id -i portfolio-deploy.pub deploy@<server>
# VPS_SSH_KEY = contents of portfolio-deploy; then delete the local copy
```

### 8. First deploy

Run **Actions → Deploy → Run workflow**. The build job pushes
`ghcr.io/mraleborg/portfolio-backend` and `portfolio-frontend`. The packages
are private at first, so the server can't pull them yet. Do one of these:

- make both packages public (GitHub → Packages → the package → Package
  settings → Change visibility). The images hold no secrets: `.env` is
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

### 9. Backups

The job must belong to `deploy`, which owns `/opt/portfolio` and can use
Docker. In another user's crontab it fails without a trace:

```bash
sudo crontab -u deploy -e
# 0 3 * * * /opt/portfolio/backup.sh >> /opt/portfolio/backup.log 2>&1
```

`backup.sh` writes a compressed, consistent copy of the database to
`/opt/portfolio/backups/`, unless the database hasn't changed since the latest
backup (logging into the admin counts as a change). It then deletes backups
older than 180 days, but always keeps the latest one, however old.
`BACKUP_DIR` and `KEEP_DAYS` change the folder and the retention, at the start
of the cron line (`0 3 * * * KEEP_DAYS=365 /opt/portfolio/backup.sh ...`).

A backup on the same disk doesn't survive losing the server, so also copy that
folder elsewhere (e.g. `rclone` to object storage, or `rsync` to another
machine).

## How a deploy works

[`deploy.yml`](../../.github/workflows/deploy.yml) deploys the whole stack for
one commit. It runs when [Backend CI](testing.md#continuous-integration)
(`backend/` or `deploy/` changed) or Frontend CI (`frontend/` changed) passes
on a push to `main`, or by hand from the Actions tab (`main` only: the
workflow ignores a run started from another branch).

1. **check**: a push that touches both parts runs both CIs. The deploy goes
   on only once every CI run for the commit has passed. While the other one
   is still running, this run stops and the other one's completion triggers
   the deploy. If one failed, nothing is deployed. A run started by hand goes
   through the same check.
2. **build**: builds the `backend` and `frontend` images and pushes them to
   GHCR, tagged `sha-<commit>`. There is no `latest` tag: a bad build can't be
   pulled by accident.
3. **deploy**: copies `compose.yml` and `backup.sh` to `/opt/portfolio/`,
   then over SSH runs `docker compose pull` and `docker compose up -d --wait`
   with `TAG=sha-<commit>`. `--wait` fails the job if a new container doesn't
   pass its health check. A container whose image didn't change isn't
   restarted. Once the containers are healthy, the deploy writes
   `TAG=sha-<commit>` in `/opt/portfolio/.env`, so every later `docker compose`
   command on the server uses the deployed images. `compose.yml` refuses to run
   without a `TAG`.
4. **Smoke test**: `curl` on `https://$API_DOMAIN/api/v1/experience/` and
   `https://$FRONTEND_DOMAIN/`.

The backend container applies migrations when it starts, before gunicorn.

In the frontend container, nginx serves `index.html` for unknown paths, so
client-side routes survive a reload. Files under `assets/` have a content hash
in their name and are cached for a year; everything else is checked again on
each visit, so a deploy shows at once.

## Operations

All from `/opt/portfolio` on the server.

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f backend` (or `frontend`); Caddy: `journalctl -u caddy -f` |
| Django shell | `docker compose exec backend python manage.py shell` |
| Restart | `docker compose restart backend` (or `frontend`) |
| Change a setting | edit `.env` (keep its `TAG=` line), then `docker compose up -d` |

### Rollback

Every deploy keeps its image tags in GHCR. To go back to an earlier commit,
change the `TAG` in `.env`, which is what a plain `docker compose up -d` uses
from then on:

```bash
sed -i 's/^TAG=.*/TAG=sha-<commit>/' .env
docker compose pull
docker compose up -d --wait
```

The next deploy from `main` replaces it. If the bad backend version had
applied a migration, restore a backup, or roll the migration back first with
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

Caddy gets a Let's Encrypt certificate for each domain in its config and
renews it by itself. It needs the DNS record in place and ports 80 and 443
open.

HSTS tells browsers to use HTTPS only, for `SECURE_HSTS_SECONDS`. It starts at
one hour so a mistake is quick to undo. Once the site has run fine over HTTPS
for a while, raise it to a year (`31536000`). HSTS preload is not enabled: it
means submitting the domain to browser vendors, which takes months to undo.

## Trying the stack locally

```bash
docker build -t ghcr.io/mraleborg/portfolio-backend:local backend/
docker build -t ghcr.io/mraleborg/portfolio-frontend:local frontend/
cp deploy/compose.yml /some/tmp/dir/
# In that dir: a .env from deploy/.env.example with ALLOWED_HOSTS=localhost,
# CSRF_TRUSTED_ORIGINS=https://localhost:8443, TAG=local, EMAIL_URL=consolemail://
docker compose up -d --wait
# A Caddy on the host network plays the server's Caddy:
printf 'localhost:8443 {\n\treverse_proxy 127.0.0.1:8000\n}\nlocalhost:8444 {\n\treverse_proxy 127.0.0.1:8080\n}\n' > Caddyfile
docker run --rm -d --name caddy --network host -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2
curl -k https://localhost:8443/api/v1/experience/
curl -k https://localhost:8444/
```

Caddy serves `localhost` with its own local certificate, hence `-k`.
