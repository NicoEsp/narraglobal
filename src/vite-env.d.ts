/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de checkout de Lemon Squeezy: el "Share → Copy link" del producto
      (https://<store>.lemonsqueezy.com/buy/<uuid> o .../checkout/buy/<uuid>).
      Si falta, el CTA de la landing cae a WhatsApp. */
  readonly VITE_LS_CHECKOUT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
