/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID?: string;
    readonly VITE_GOOGLE_CLIENT_IDS?: string;
    readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_PROXY_TARGET?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
