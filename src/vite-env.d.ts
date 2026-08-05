/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de checkout de Lemon Squeezy: el "Share → Copy link" del producto
      (https://<store>.lemonsqueezy.com/buy/<uuid> o .../checkout/buy/<uuid>).
      Si falta, el CTA de la landing cae a WhatsApp. */
  readonly VITE_LS_CHECKOUT_URL?: string;
  /** URL de checkout de Mercado Pago para la región Argentina del Narra ID.
      Si falta, ese CTA cae a WhatsApp. */
  readonly VITE_MP_CHECKOUT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
