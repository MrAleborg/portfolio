# Portfolio frontend

React + TypeScript + Vite single-page app. It shows the owner's profile, read
from the backend API, in English and French.

## Structure

Domain-driven layers under `src/`:

- `domain/`: entities and ports (`Profile`, `ProfileRepository`, `Locale`)
- `infrastructure/`: adapters to the outside world (`httpProfileRepository`)
- `ui/`: React components, pages, routes and messages

## Commands

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library
npm run lint
npm run typecheck
npm run build
```

## Configuration

The site calls the API on its own domain (`/api/...`). In production the
server's Caddy sends `/api/` to the backend; with `npm run dev`, Vite proxies
`/api` to the backend on `http://localhost:8000` (see `vite.config.ts`), which
must be running.

`VITE_API_URL` can point the site at a backend on another domain instead (e.g.
`VITE_API_URL=https://api.example.com npm run dev`); that backend must then
allow the site's origin in `CORS_ALLOWED_ORIGINS`.
