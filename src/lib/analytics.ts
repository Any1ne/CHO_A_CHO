// src/lib/analytics.ts
export interface EcommerceItem {
  item_id?: string;
  item_name?: string;
  price?: number;
  quantity?: number;
  [key: string]: unknown;
}

export interface AnalyticsEvent {
  event: string;
  ecommerce?: {
    value?: number;
    currency?: string;
    transaction_id?: string;
    items?: EcommerceItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = localStorage.getItem("cookie_consent");
    return c === "all";
  } catch {
    return false;
  }
}

/**
 * Push an object to dataLayer if consent is given (or force=true).
 * payload should follow GA4 expected structure, e.g.:
 * { event: 'add_to_cart', ecommerce: { value: 100, currency: 'UAH', items: [...] } }
 */
export function pushEvent(payload: AnalyticsEvent, force = false) {
  if (typeof window === "undefined") return;
  if (!force && !hasAnalyticsConsent()) return;
  // ensure dataLayer exists and has the expected type
  (window.dataLayer ??= []) as Record<string, unknown>[];
  try {
    window.dataLayer.push(payload as Record<string, unknown>);
  } catch {
    // fail silently — analytics must not break UX
  }
}
