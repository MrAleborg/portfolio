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

`VITE_API_URL` is the base URL of the backend (no path). `.env.development`
sets it to `http://localhost:8000` for `npm run dev`; the backend must allow
`http://localhost:5173` in `CORS_ALLOWED_ORIGINS`. The Docker image takes it as
the build argument `VITE_API_URL`, because Vite bakes it into the bundle:

```sh
docker build --build-arg VITE_API_URL=https://api.example.com .
```
