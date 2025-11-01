/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * 🧩 ANLAYTICS EVENTS OVERVIEW
 * 
 * ✅ Реалізовані події:
 *  - add_to_cart — додавання товару до кошика
 *  - begin_checkout — початок оформлення замовлення
 *  - purchase — успішна оплата/створення замовлення
 *  - wholesale_toggled — перемикання режиму гуртових цін
 * 
 * 💤 (Поки не реалізовані / закоментовані):
 *  - remove_from_cart — видалення товару з кошика
 *  - update_cart — зміна кількості товарів
 *  - init_basket — ініціалізація кошика
 *  - catalog_filter / catalog_search / page_view — взаємодія з каталогом
 *  - view_item / view_item_detail / product_modal_close — взаємодія з карткою товару
 *  - checkout_step / checkout_step_complete — навігація по кроках оформлення
 *  - checkout_info_progress — заповнення контактних / платіжних / доставкових даних
 *  - confirm_order — підтвердження замовлення
 */

import { Middleware } from "@reduxjs/toolkit";
import { pushEvent, hasAnalyticsConsent} from "@/lib/analytics";
import type { RootState } from "../types";

// ==== slices / thunks ====
import {
  addToBasket,
  // removeFromBasket,
  // increaseQuantity,
  // decreaseQuantity,
  // setQuantity,
  // clearBasket,
  // initBasket,
} from "@/store/slices/basketSlice";

// import {
//   setSelectedCategory,
//   setSortOption,
//   setSearchTerm,
//   setCurrentPage,
// } from "@/store/slices/catalogueSlice";

import {
  setStep,
  // completeStep,
  // setContactInfo,
  // setDeliveryInfo,
  // setPaymentInfo,
  // resetCheckout,
  updateWholesale,
  placeOrder,
  // confirmOrder,
  checkOrderStatus,
  beginCheckout,
} from "@/store/slices/checkoutSlice";

// import {
//   openProductModal,
//   closeProductModal,
//   fetchProductSuccess,
//   setProductFlavours,
// } from "@/store/slices/productModalSlice";

// ==== dedupe helper ====
const lastPushMap = new Map<string, number>();
const DEDUPE_WINDOW = 2000; // ms

function dedupeKey(key: string) {
  const now = Date.now();
  const last = lastPushMap.get(key) ?? 0;
  if (now - last < DEDUPE_WINDOW) return true;
  lastPushMap.set(key, now);
  return false;
}

// function buildCartSummary(state: any) {
//   const items = state.basket?.items ?? [];
//   const total = items.reduce((sum: number, it: any) => {
//     const price = Number(it.price ?? it.wholesale_price ?? 0);
//     const qty = Number(it.quantity ?? 1);
//     return sum + price * qty;
//   }, 0);
//   return { items, total, count: items.length };
// }

// ==== MAIN MIDDLEWARE ====
export const analyticsMiddleware: Middleware<any, RootState> =
  (store) => (next) => (action: any) => {
    const prevState = store.getState();
    const result = next(action);

    try {
      const nextState = store.getState();

      // ====== BASKET EVENTS ======
      if (action.type === addToBasket.type) {
        const item = action.payload;
        const key = `add_to_cart:${item.id}:${item.quantity}`;
        if (!dedupeKey(key)) {
          console.log("🛒 [Analytics] add_to_cart event triggered:");
          pushEvent({
            event: "add_to_cart",
            ecommerce: {
              currency: "UAH",
              value:
                Number(item.price ?? item.wholesale_price ?? 0) *
                Number(item.quantity ?? 1),
              items: [
                {
                  item_id: item.id,
                  item_name: item.title ?? item.name,
                  price: Number(item.price ?? item.wholesale_price ?? 0),
                  quantity: Number(item.quantity ?? 1),
                },
              ],
            },
          });
        }
      }

      // ====== CHECKOUT / ORDER EVENTS ======
      // --- початок оформлення ---
      if (
        action.type === beginCheckout.type ||
        (action.type === setStep.type && action.payload === "contact")
      ) {
        if (!dedupeKey("begin_checkout")) {
          console.log("🧾 [Analytics] begin_checkout event triggered");
          pushEvent({ event: "begin_checkout" });
        }
      }

// --- оплата / purchase ---
if (action.type === checkOrderStatus.fulfilled.type) {
  const payload = action.payload as any;
  const order = payload?.orderData;
  
  // 🔁 беремо статус напряму з Redux state
  const state = store.getState();
  const isConfirmed = state.checkout?.lastOrder?.status === "confirmed";
  const key = `purchase:${order?.orderId ?? order?.orderNumber ?? ""}`;
  const isDuplicate = dedupeKey(key);

  // 🔍 ДЕТАЛЬНИЙ ЛОГ ПЕРЕД УМОВОЮ
  console.log("🔍 [Purchase Debug] Checking conditions:", {
    actionType: action.type,
    hasPayload: !!payload,
    hasOrder: !!order,
    orderId: order?.orderId,
    orderNumber: order?.orderNumber,
    orderStatus: order?.status,
    lastOrderStatus: state.checkout?.lastOrder?.status,
    lastOrderId: state.checkout?.lastOrder?.orderId,
    isConfirmed,
    isDuplicate,
    dedupeKey: key,
    willTriggerEvent: isConfirmed && !!order && !isDuplicate,
    fullOrder: order,
    fullLastOrder: state.checkout?.lastOrder,
  });

  if (isConfirmed && order && !isDuplicate) {
    const items =
      Array.isArray(order?.items) && order.items.length
        ? order.items.map((i: any) => ({
            item_id: i.id ?? i.item_id ?? "",
            item_name: i.title ?? i.name ?? "",
            price: Number(i.price ?? 0),
            quantity: Number(i.quantity ?? i.qty ?? 1),
          }))
        : [];

    console.log("💸 [Analytics] purchase event triggered:", {
      orderId: order?.orderId ?? order?.orderNumber,
      total: order?.total,
      itemsCount: items.length,
      hasConsent: hasAnalyticsConsent(),
      dataLayerExists: typeof window !== "undefined" && !!window.dataLayer,
    });

    pushEvent(
      {
        event: "purchase",
        ecommerce: {
          transaction_id: order?.orderId ?? order?.orderNumber ?? "",
          currency: "UAH",
          value: Number(order?.total ?? 0),
          items,
        },
      },
      true
    );
  } else {
    // 🔍 ЛОГ ЯКЩО ПОДІЯ НЕ СПРАЦЮВАЛА
    console.warn("⚠️ [Purchase Blocked] Event not triggered because:", {
      isConfirmed,
      hasOrder: !!order,
      isDuplicate,
      reason: !isConfirmed
        ? "Order not confirmed"
        : !order
        ? "No order data"
        : isDuplicate
        ? "Duplicate event"
        : "Unknown",
    });
  }
}

      // --- перемикання оптового режиму ---
      if (action.type === updateWholesale.type) {
        const prevIsWholesale =
          !!prevState.checkout?.checkoutSummary?.isWholesale;
        const nextIsWholesale =
          !!nextState.checkout?.checkoutSummary?.isWholesale;

        if (prevIsWholesale !== nextIsWholesale) {
          const threshold = action.payload as number | undefined;
          const dedupeKeyName = `wholesale_threshold:${String(
            threshold ?? "unknown"
          )}`;

          if (!dedupeKey(dedupeKeyName)) {
            console.log("🔁 [Analytics] wholesale_toggled event:", {
              prevIsWholesale,
              nextIsWholesale,
              threshold,
            });
            pushEvent({
              event: "wholesale_toggled",
              meta: { threshold, isWholesale: nextIsWholesale },
            });
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Analytics middleware error:", err);
    }

    return result;
  };