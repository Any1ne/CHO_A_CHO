import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "@/store/types";
import { clearBasket } from "./basketSlice";
import { toast } from "sonner";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createInvoiceOnServer } from "@/vendor/monobank";
import { Step, ContactInfo, DeliveryInfo, PaymentInfo, CheckoutSummary, OrderSummary } from "@/types";
import { submitOrder, fetchOrderStatus, fetchRedisOrder, saveRedisOrderToServer, checkInvoiceStatus } from "@/lib/api";
import { nanoid } from 'nanoid';

interface LastOrder {
  orderId: string;
  orderNumber?: string;
  status?: string;
  timestamp?: string;
}

interface CheckoutState {
  currentStep: Step;
  completedSteps: Step[];
  checkoutSummary: CheckoutSummary;
  isSubmitting: boolean;
  checkoutStartedAt: string | null;
  lastOrder?: LastOrder | null;
}

const initialState: CheckoutState = {
  currentStep: "contact",
  completedSteps: [],
  checkoutSummary: {
    contactInfo: undefined,
    deliveryInfo: undefined,
    paymentInfo: undefined,
    isWholesale: false,
  },
  checkoutStartedAt: null, 
  isSubmitting: false,
  checkoutStartedAt: null,
};

// ======= ASYNC THUNKS залишаються без змін, бо вони вже адаптовані ========= //

export const placeOrder = createAsyncThunk<
  void,
  { router: AppRouterInstance },
  { dispatch: AppDispatch; state: RootState }
>("checkout/placeOrder", async ({ router }, { getState, dispatch }) => {
  const state = getState();
  const { checkoutSummary } = state.checkout;
  const items = state.basket.items;

  const isWholesale = checkoutSummary?.isWholesale ?? false;
  const total = items.reduce((sum, item) => {
    const price = isWholesale ? item.wholesale_price : item.price;
    return sum + price * item.quantity;
  }, 0);

  if (
    !checkoutSummary?.contactInfo ||
    !checkoutSummary?.deliveryInfo ||
    !checkoutSummary?.paymentInfo
  ) {
    toast.error("Будь ласка, заповніть усі дані перед підтвердженням замовлення.");
    return;
  }

  const orderId = nanoid();
  const { paymentMethod } = checkoutSummary.paymentInfo;

  let invoiceId: string | undefined;
  let invoiceResponse: { invoiceId: string; paymentUrl: string } | undefined;

  let checkoutSummaryWithInvoice = checkoutSummary;

  if (paymentMethod === "monobank") {
    try {
      const redirectUrl = `${window.location.origin}/checkout/confirm`;
      invoiceResponse = await createInvoiceOnServer(orderId, total, redirectUrl);
      invoiceId = invoiceResponse.invoiceId;

      // Створюємо копію з invoiceId
      checkoutSummaryWithInvoice = {
        ...checkoutSummary,
        paymentInfo: {
          ...checkoutSummary.paymentInfo,
          invoiceId,
        },
      };
    } catch (error) {
      console.error("Не вдалося створити інвойс:", error);
      toast.error("Не вдалося створити інвойс.");
      return;
    }
  }

  const redisOrderData: OrderSummary = {
    orderId,
    checkoutSummary: checkoutSummaryWithInvoice ? checkoutSummaryWithInvoice : checkoutSummary,
    status: paymentMethod === "monobank" ? "pending_payment" : "created",
    items,
    total,
  };

  dispatch(setOrderResult({
    orderId,
    status: redisOrderData.status,
    timestamp: new Date().toISOString()
  }));

  try {
    await saveRedisOrderToServer(redisOrderData);

    sessionStorage.setItem("orderId", orderId);

    switch (paymentMethod) {
      case "monobank": {
        sessionStorage.setItem("redirectToPayment", "true");
        sessionStorage.setItem("invoiceId", invoiceId!);
        toast.success("Замовлення збережено. Переходимо до оплати.");

        setTimeout(() => {
          window.location.href = invoiceResponse ? invoiceResponse.paymentUrl : "";
        }, 1500); // 1.5 секунди

        return;
      }

      case "cod": {
        toast.success("Замовлення збережено. Очікуйте підтвердження.");
        sessionStorage.setItem("redirectToPayment", "true");

        setTimeout(() => {
          router.push(`/checkout/confirm?orderId=${orderId}`);
        }, 1500); // 1.5 секунди

        return;
      }

      default:
        toast.error("Невідомий спосіб оплати.");
        return;
    }

  } catch (error) {
    console.error("Помилка при збереженні замовлення:", error);
    toast.error("Не вдалося зберегти замовлення. Спробуйте ще раз.");
  }
});

export const confirmOrder = createAsyncThunk<
  void,
  { orderId: string; router: AppRouterInstance },
  { dispatch: AppDispatch; state: RootState }
>("checkout/confirmOrder", async ({ orderId, router }, { dispatch }) => {
  try {
    const redisOrderData = await fetchRedisOrder(orderId);

    if (!redisOrderData) {
      toast.error("Не вдалося отримати дані замовлення.");
      return;
    }

    const { checkoutSummary, items, total } = redisOrderData;

    // Якщо оплата через Monobank
    if (checkoutSummary?.paymentInfo?.paymentMethod === "monobank") {
      if (!checkoutSummary?.paymentInfo?.invoiceId) throw new Error("Відсутній invoiceId");

      const invoiceStatus = await checkInvoiceStatus(checkoutSummary?.paymentInfo?.invoiceId);

      if (invoiceStatus.status !== "success") {
        toast.error("Оплата не підтверджена.");
        return;
      }
    }

    // Формуємо payload для збереження в БД
    const orderPayload: OrderSummary = {
      orderId,
      checkoutSummary,
      total,
      items,
      status: "confirmed",
    };

    const result = await submitOrder(orderPayload);

    if (!result?.OrderNumber) {
      throw new Error("Сервер не повернув номер замовлення");
    }

    dispatch(clearBasket());
    dispatch(resetCheckout());
    dispatch(setOrderResult({
      orderId,
      orderNumber: result.OrderNumber,
      status: "confirmed",
      timestamp: new Date().toISOString()
    }));
    toast.success("Замовлення успішно оформлено!");
    router.push(`/checkout/success?orderId=${orderId}`);
  } catch (error) {
    console.error("Помилка при оформленні:", error);
    toast.error(error instanceof Error ? error.message : "Помилка при створенні замовлення.");
  }
});

export const checkOrderStatus = createAsyncThunk<
  { orderData: OrderSummary | null },
  string,
  { dispatch: AppDispatch; state: RootState }
>("checkout/checkOrderStatus", async (orderId, { dispatch, rejectWithValue }) => {
  try {
    const result = await fetchOrderStatus(orderId);

    if (!result.orderData) {
      return rejectWithValue("Замовлення не знайдено.");
    }

    const { orderData } = result;

    dispatch(setOrderResult({
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      timestamp: new Date().toISOString(),
    }));

    return { orderData };
  } catch (error) {
    console.error("checkOrderStatus error:", error);
    return rejectWithValue("Серверна помилка при перевірці замовлення.");
  }
});

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<Step>) {
      state.currentStep = action.payload;
    },
    completeStep(state, action: PayloadAction<Step>) {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    setContactInfo(state, action: PayloadAction<ContactInfo>) {
      state.checkoutSummary.contactInfo = action.payload;
    },
    setDeliveryInfo(state, action: PayloadAction<DeliveryInfo>) {
      state.checkoutSummary.deliveryInfo = action.payload;
    },
    setPaymentInfo(state, action: PayloadAction<PaymentInfo>) {
      state.checkoutSummary.paymentInfo = action.payload;
    },
    resetCheckout() {
      return initialState;
    },
    updateWholesale(state, action: PayloadAction<number>) {
      state.checkoutSummary.isWholesale = action.payload >= 1350;
    },
    beginCheckout(state) {
      state.checkoutStartedAt = new Date().toISOString();
    },
    setOrderResult(state, action: PayloadAction<LastOrder>) {
      state.lastOrder = action.payload;
    },
    // додатково: очистити інформацію про останнє замовлення (за потреби)
    clearLastOrder(state) {
      state.lastOrder = null;
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(confirmOrder.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(confirmOrder.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(confirmOrder.rejected, (state) => {
        state.isSubmitting = false;
      })
      .addCase(placeOrder.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(placeOrder.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(placeOrder.rejected, (state) => {
        state.isSubmitting = false;
      })
      // Цей блок можна прибрати, якщо orderStatus не зберігається тут
      .addCase(checkOrderStatus.fulfilled, () => {
        // intentionally left blank
      })
      .addCase(checkOrderStatus.rejected, (state, action) => {
        console.warn("checkOrderStatus rejected:", action.payload);
      })
      ;
  },
});


// ======= ЕКСПОРТИ ========= //

export const {
  setStep,
  completeStep,
  setContactInfo,
  setDeliveryInfo,
  setPaymentInfo,
  resetCheckout,
  updateWholesale,
  beginCheckout,
  setOrderResult,
  clearLastOrder
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
