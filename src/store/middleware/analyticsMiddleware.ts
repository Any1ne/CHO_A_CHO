/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Middleware } from "@reduxjs/toolkit";
import { pushEvent } from "@/lib/analytics";
import type { RootState } from "../types"; 
// slices / thunks
import {
  addToBasket,
  removeFromBasket,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  clearBasket,
  initBasket,
} from "@/store/slices/basketSlice";

import {
  setSelectedCategory,
  setSortOption,
  setSearchTerm,
  setCurrentPage,
} from "@/store/slices/catalogueSlice";

import {
  setStep,
  completeStep,
  setContactInfo,
  setDeliveryInfo,
  setPaymentInfo,
//   resetCheckout,
  updateWholesale,
  placeOrder,
  confirmOrder,
  checkOrderStatus,
} from "@/store/slices/checkoutSlice";

import {
  openProductModal,
  closeProductModal,
  fetchProductSuccess,
  setProductFlavours,
} from "@/store/slices/productModalSlice";

// простий декупер для уникнення дублювання подій (на сесію)
const lastPushMap = new Map<string, number>();
const DEDUPE_WINDOW = 2000; // ms

function dedupeKey(key: string) {
  const now = Date.now();
  const last = lastPushMap.get(key) ?? 0;
  if (now - last < DEDUPE_WINDOW) return true;
  lastPushMap.set(key, now);
  return false;
}

function buildCartSummary(state: any) {
  const items = state.basket?.items ?? [];
  const total = items.reduce((sum: number, it: any) => {
    const price = Number(it.price ?? it.wholesale_price ?? 0);
    const qty = Number(it.quantity ?? 1);
    return sum + price * qty;
  }, 0);
  return { items, total, count: items.length };
}

export const analyticsMiddleware: Middleware<any, RootState> = (store) => (next) => (action:any) => {
  const result = next(action);

  
  try {
    const state = store.getState() as any;

    // ====== BASKET EVENTS ======
    if (action.type === addToBasket.type) {
      const item = action.payload;
      const key = `add_to_cart:${item.id}:${item.quantity}`;
      if (!dedupeKey(key)) {
        pushEvent({
          event: "add_to_cart",
          ecommerce: {
            currency: "UAH",
            value: Number(item.price ?? item.wholesale_price ?? 0) * Number(item.quantity ?? 1),
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

    if (action.type === removeFromBasket.type) {
      const productId = action.payload as string;
      const key = `remove_from_cart:${productId}`;
      if (!dedupeKey(key)) {
        pushEvent({
          event: "remove_from_cart",
          ecommerce: {
            items: [{ item_id: productId }],
          },
        });
      }
    }

    // // quantity changes -> update_cart
    // if (
    //   action.type === increaseQuantity.type ||
    //   action.type === decreaseQuantity.type ||
    //   action.type === setQuantity.type ||
    //   action.type === clearBasket.type
    // ) {
    //   const summary = buildCartSummary(state);
    //   const key = `update_cart:${summary.total}:${summary.count}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "update_cart",
    //       ecommerce: {
    //         currency: "UAH",
    //         value: Number(summary.total ?? 0),
    //         items: summary.items.map((i: any) => ({
    //           item_id: i.id,
    //           item_name: i.title ?? i.name,
    //           price: Number(i.price ?? i.wholesale_price ?? 0),
    //           quantity: Number(i.quantity ?? 1),
    //         })),
    //       },
    //     });
    //   }
    // }

    // if (action.type === initBasket.type) {
    //   const summary = buildCartSummary(state);
    //   const key = `init_basket:${summary.count}:${summary.total}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "init_basket",
    //       ecommerce: {
    //         currency: "UAH",
    //         value: Number(summary.total ?? 0),
    //         items: summary.items.map((i: any) => ({
    //           item_id: i.id,
    //           item_name: i.title ?? i.name,
    //           price: Number(i.price ?? i.wholesale_price ?? 0),
    //           quantity: Number(i.quantity ?? 1),
    //         })),
    //       },
    //     });
    //   }
    // }

    // ====== CATALOGUE / LIST EVENTS ======
    // if (action.type === setSelectedCategory.type) {
    //   const category = action.payload as string;
    //   const key = `catalog_filter:category:${category}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "catalog_filter",
    //       filter: { category },
    //     });
    //   }
    // }

    // if (action.type === setSortOption.type) {
    //   const sortOption = action.payload as string;
    //   const key = `catalog_filter:sort:${sortOption}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "catalog_filter",
    //       filter: { sortOption },
    //     });
    //   }
    // }

    // if (action.type === setSearchTerm.type) {
    //   const searchTerm = action.payload as string;
    //   const key = `catalog_filter:search:${searchTerm}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "catalog_search",
    //       search: { query: searchTerm },
    //     });
    //   }
    // }

    // if (action.type === setCurrentPage.type) {
    //   const page = action.payload as number;
    //   const key = `page_view:catalog:${page}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "page_view",
    //       page: `catalog_page_${page}`,
    //     });
    //   }
    // }

    // ====== PRODUCT MODAL / PRODUCT EVENTS ======
    // if (action.type === openProductModal.type) {
    //   const productId = action.payload as string;
    //   const key = `view_item:${productId}`;
    //   if (!dedupeKey(key)) {
    //     const product = state.productModal?.product;
    //     const item = product
    //       ? {
    //           item_id: product.id,
    //           item_name: product.title ?? product.name,
    //           price: Number(product.price ?? product.wholesale_price ?? 0),
    //           quantity: 1,
    //         }
    //       : { item_id: productId };

    //     pushEvent({
    //       event: "view_item",
    //       ecommerce: { items: [item] },
    //     });
    //   }
    // }

    // if (action.type === fetchProductSuccess.type) {
    //   // full product loaded inside modal
    //   const product = action.payload;
    //   const key = `view_item_full:${product?.id}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "view_item_detail",
    //       ecommerce: {
    //         items: [
    //           {
    //             item_id: product.id,
    //             item_name: product.title ?? product.name,
    //             price: Number(product.price ?? product.wholesale_price ?? 0),
    //             item_category: product.category,
    //           },
    //         ],
    //       },
    //     });
    //   }
    // }

    // if (action.type === setProductFlavours.type) {
    //   const flavours = action.payload;
    //   const key = `product_flavours_loaded:${(flavours && flavours.length) || 0}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "product_flavours_loaded",
    //       meta: { count: flavours.length ?? 0 },
    //     });
    //   }
    // }

    // if (action.type === closeProductModal.type) {
    //   const key = `product_modal_close`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({ event: "product_modal_close" });
    //   }
    // }

    // ====== CHECKOUT / ORDER EVENTS ======
    // // User started checkout flow -> placeOrder.pending is good for begin_checkout
    if (action.type === placeOrder.pending.type) {
      if (!dedupeKey("begin_checkout")) {
        pushEvent({ event: "begin_checkout" });
      }
    }

    // // Track checkout steps (e.g., when user sets step in stepper)
    // if (action.type === setStep.type) {
    //   const step = action.payload as string;
    //   const key = `checkout_step:${step}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "checkout_step",
    //       step,
    //     });
    //   }
    // }

    // if (action.type === completeStep.type) {
    //   const step = action.payload as string;
    //   const key = `checkout_step_complete:${step}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "checkout_step_complete",
    //       step,
    //     });
    //   }
    // }

    // When server returns order status (checkOrderStatus) -> if paid, fire purchase
    if (action.type === checkOrderStatus.fulfilled.type) {
      const payload = action.payload as any;
      const order = payload?.orderData;
      const isPaid = payload?.isPaid;
      const key = `purchase:${order?.orderId ?? order?.orderNumber ?? ""}`;

      if (isPaid && order && !dedupeKey(key)) {
        const items =
          Array.isArray(order?.items) && order.items.length
            ? order.items.map((i: any) => ({
                item_id: i.id ?? i.item_id ?? "",
                item_name: i.title ?? i.name ?? "",
                price: Number(i.price ?? 0),
                quantity: Number(i.quantity ?? i.qty ?? 1),
              }))
            : [];

        pushEvent({
          event: "purchase",
          ecommerce: {
            transaction_id: order?.orderId ?? order?.orderNumber ?? "",
            currency: "UAH",
            value: Number(order?.total ?? 0),
            items,
          },
        });
      }
    }

    // // fallback: if confirmOrder.fulfilled carries useful info in meta.arg, emit begin/complete events
    // if (action.type === confirmOrder.fulfilled.type) {
    //   // confirmOrder signature has { orderId, router } as arg
    //   const arg = (action as any).meta?.arg;
    //   const orderId = arg?.orderId;
    //   if (orderId && !dedupeKey(`confirm_order:${orderId}`)) {
    //     pushEvent({
    //       event: "confirm_order",
    //       meta: { orderId },
    //     });
    //   }
    // }

    // ====== OTHER CHECKPOINTS ======
    // Track changes to contact/delivery/payment info (partial checkout analytics)
    // if (
    //   action.type === setContactInfo.type ||
    //   action.type === setDeliveryInfo.type ||
    //   action.type === setPaymentInfo.type
    // ) {
    //   const key = `checkout_info_progress:${action.type}`;
    //   if (!dedupeKey(key)) {
    //     pushEvent({
    //       event: "checkout_info_progress",
    //       infoType:
    //         action.type === setContactInfo.type
    //           ? "contact"
    //           : action.type === setDeliveryInfo.type
    //           ? "delivery"
    //           : "payment",
    //     });
    //   }
    // }

    // updateWholesale maybe indicates switch to wholesale prices
    if (action.type === updateWholesale.type) {
      const threshold = action.payload as number;
      if (!dedupeKey(`wholesale_threshold:${threshold}`)) {
        pushEvent({
          event: "wholesale_toggled",
          meta: { threshold },
        });
      }
    }
  } catch (err) {
    // swallow analytics errors (no user impact)
    // console.debug("analytics middleware error", err);
  }

  return result;
};
