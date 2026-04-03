export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Adiciona gtag ao objeto Window
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ─── Primitivos ───────────────────────────────────────────────────────────────

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const trackPageView = (url: string) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const trackEvent = (action: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
};

// ─── Tipos de Produtos ────────────────────────────────────────────────────────

export interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
}

// ─── Eventos de Conversão (GA4 E-commerce) ────────────────────────────────────

/**
 * Disparado quando a página de detalhe do produto é visualizada.
 * GA4 Event: view_item
 */
export const trackProductView = (item: GA4Item) => {
  trackEvent("view_item", {
    currency: "BRL",
    value: item.price,
    items: [item],
  });
};

/**
 * Disparado quando o usuário clica em um card de produto na listagem.
 * GA4 Event: select_item
 */
export const trackProductClick = (item: GA4Item, listName?: string) => {
  trackEvent("select_item", {
    item_list_name: listName ?? "Listagem de Produtos",
    items: [item],
  });
};

/**
 * Disparado quando o usuário inicia o processo de checkout.
 * GA4 Event: begin_checkout
 */
export const trackBeginCheckout = (items: GA4Item[], value: number) => {
  trackEvent("begin_checkout", {
    currency: "BRL",
    value,
    items,
  });
};

/**
 * Disparado quando um pedido é finalizado com sucesso.
 * GA4 Event: purchase
 */
export const trackPurchase = (params: {
  transaction_id: string;
  value: number;
  items: GA4Item[];
  shipping?: number;
}) => {
  trackEvent("purchase", {
    currency: "BRL",
    ...params,
  });
};
