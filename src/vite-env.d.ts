/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string
  readonly VITE_IS_DEV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
