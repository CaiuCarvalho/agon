declare global {
  interface Window { dataLayer: Record<string, unknown>[] }
}

export interface AnalyticsItem {
  item_id: string
  item_name: string
  price: number
  quantity: number
}

export function trackEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

export const trackViewItem = (item: AnalyticsItem) =>
  trackEvent('view_item', { currency: 'BRL', value: item.price, items: [item] })

export const trackAddToCart = (item: AnalyticsItem) =>
  trackEvent('add_to_cart', { currency: 'BRL', value: item.price * item.quantity, items: [item] })

export const trackRemoveFromCart = (item: AnalyticsItem) =>
  trackEvent('remove_from_cart', { currency: 'BRL', value: item.price * item.quantity, items: [item] })

export const trackBeginCheckout = (items: AnalyticsItem[], value: number) =>
  trackEvent('begin_checkout', { currency: 'BRL', value, items })

export const trackPurchase = (orderId: string, value: number, items: AnalyticsItem[]) =>
  trackEvent('purchase', { currency: 'BRL', transaction_id: orderId, value, items })

export const trackLogin  = () => trackEvent('login',   { method: 'email' })
export const trackSignUp = () => trackEvent('sign_up', { method: 'email' })
