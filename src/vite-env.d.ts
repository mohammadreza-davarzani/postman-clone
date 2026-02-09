/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROXY_URL?: string;
  readonly VITE_DOWNLOAD_PAGE?: string;
  readonly VITE_DOWNLOAD_URL_MAC?: string;
  readonly VITE_DOWNLOAD_URL_WIN?: string;
  readonly VITE_DOWNLOAD_URL_LINUX?: string;
  readonly VITE_RELEASE_TAG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    electronAPI?: { platform: string };
  }
}

export {};
