/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Wix Headless OAuth client ID, created in your site's dashboard under
   * Settings > Development & integrations > Headless Settings.
   *
   * This value is public and safe to ship in the bundle: Wix Headless OAuth
   * uses PKCE, so no client secret is involved for visitor or member flows.
   */
  readonly VITE_WIX_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
