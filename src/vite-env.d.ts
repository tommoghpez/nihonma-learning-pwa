/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_YT_API_KEY: string
  readonly VITE_CHANNEL_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_YOUTUBE_CHANNEL_HANDLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
