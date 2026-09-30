/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. Unset: the API is on the site's own domain. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
