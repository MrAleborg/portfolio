# Page summaries are built by the backend and spliced in by nginx

The site is drawn in the browser, so crawlers and link previews got an empty page. We only aim to rank for the owner's name, and everything a Page summary needs (name, headline, bio, contact links) already lives in the admin. So the backend builds each Page summary per request, and the frontend's nginx inserts it into the built shell with an SSI include. The page body stays drawn in the browser.

## Considered Options

- **Tags hardcoded at build time**: copies admin content into the frontend, so it drifts whenever the Profile is edited.
- **Prerendering whole pages at build time**: goes stale until the next deploy whenever content changes.
- **Server-side rendering** (React Router framework mode): adds a Node server and a large rewrite, out of proportion for name searches.
- **Django serving the whole shell**: needs the Vite build inside the backend image, which ties the two deploys together.

## Consequences

The address list (Pages × Locales, old links) is repeated in nginx, the backend and the frontend router. Under `vite dev` only the generic title shows. Revisit this if the site needs to rank for content, which needs the body in the first HTML response.
