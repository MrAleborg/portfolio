# portfolio
[![Backend CI](https://github.com/MrAleborg/portfolio/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/MrAleborg/portfolio/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/MrAleborg/portfolio/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/MrAleborg/portfolio/actions/workflows/frontend-ci.yml)
[![Deploy](https://github.com/MrAleborg/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/MrAleborg/portfolio/actions/workflows/deploy.yml)

Here is the source of my Portfolio

The backend and the frontend are deployed with Docker Compose on a VPS: see
[backend/docs/deployment.md](backend/docs/deployment.md).

A dev environment (Django runserver + Vite, on port 8080) can be deployed to any
Docker box over ssh, e.g. a Raspberry Pi: `deploy/dev-deploy.sh`, configured in `deploy/.env.dev` (see
[deploy/.env.dev.example](deploy/.env.dev.example)).
