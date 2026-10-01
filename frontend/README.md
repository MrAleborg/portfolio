# Portfolio frontend

React + TypeScript + Vite single-page app. It shows the owner's profile and
resume, read from the backend API, in English and French.

## Structure

Domain-driven layers under `src/`:

- `domain/`: entities, value objects and ports (`Profile`, `Education`,
  `Period`, `Locale`, and a repository per entity)
- `infrastructure/`: adapters to the outside world (`http*Repository`, on top
  of `getJson`)
- `ui/`: React components, pages, routes and messages

The resume is made of reusable pieces, so each kind of entry only maps itself
onto them:

- `components/Tile`: a card for one entry (title, subtitle, meta line), whose
  title expands its details,
  and `components/TileList` to lay tiles out in a grid
- `resume/ResumeSection`: a titled section that shows the loading, error,
  empty or tile states of the entries it is given
- `resume/EducationTile` and `resume/EducationSection`: the education entries,
  loaded with `async/useAsync`

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

The nginx image sends a Content-Security-Policy with `default-src 'self'`, so
the browser only lets the site call an API on its own origin (`/api/`). A build
with `VITE_API_URL` pointing at another origin needs that origin added to a
`connect-src` directive in `nginx.conf`.
