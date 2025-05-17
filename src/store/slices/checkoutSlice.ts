import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "@/store";
import { clearBasket } from "./basketSlice";
import { toast } from "sonner";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { submitOrder } from "@/lib/api";

type ContactInfo = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  email: string;
};

type DeliveryInfo = {
  city: string;
  deliveryMethod: "branch" | "address";
  branchNumber?: string;
  address?: string;
};

type PaymentInfo = {
  paymentMethod: "cod" | "monobank";
};

type Step = "contact" | "delivery" | "payment";

interface CheckoutState {
  currentStep: Step;
  completedSteps: Step[];
  contactInfo?: ContactInfo;
  deliveryInfo?: DeliveryInfo;
  paymentInfo?: PaymentInfo;
  isSubmitting: boolean;
  isFreeDelivery: boolean;
}

const initialState: CheckoutState = {
  currentStep: "contact",
  completedSteps: [],
  isSubmitting: false,
  isFreeDelivery: false
};

export const confirmOrder = createAsyncThunk<
  void,
  { router: AppRouterInstance },
  { dispatch: AppDispatch; state: RootState }
>("checkout/confirmOrder", async ({ router }, { getState, dispatch }) => {
  const state = getState();
  const { contactInfo, deliveryInfo, paymentInfo } = state.checkout;
  const items = state.basket.items;
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (!contactInfo || !deliveryInfo || !paymentInfo) {
    toast.error(
      "Будь ласка, заповніть усі дані перед підтвердженням замовлення."
    );
    return;
  }

  try {
    const { orderId } = await submitOrder({
      total,
      items,
      data: {
        contact: contactInfo,
        delivery: deliveryInfo,
        payment: paymentInfo,
        isFreeDelivery: state.checkout.isFreeDelivery,
      },
    });

    // Зберігаємо дані в sessionStorage
    const fullName = `${contactInfo.lastName} ${contactInfo.firstName}${
      contactInfo.middleName ? " " + contactInfo.middleName : ""
    }`;

    const orderSummary = {
      orderNumber: orderId,
      fullName,
      phone: contactInfo.phone,
      email: contactInfo.email,
      city: deliveryInfo.city,
      deliveryMethod: deliveryInfo.deliveryMethod,
      branchNumber: deliveryInfo.branchNumber,
      address: deliveryInfo.address,
      paymentMethod: paymentInfo.paymentMethod,
      total,
    };

    sessionStorage.setItem("orderData", JSON.stringify(orderSummary));

    dispatch(clearBasket());
    dispatch(resetCheckout());
    toast.success("Замовлення успішно оформлено!");
    router.push("/checkout/success");
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Помилка при створенні замовлення."
    );
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
      state.contactInfo = action.payload;
    },
    setDeliveryInfo(state, action: PayloadAction<DeliveryInfo>) {
      state.deliveryInfo = action.payload;
    },
    setPaymentInfo(state, action: PayloadAction<PaymentInfo>) {
      state.paymentInfo = action.payload;
    },
    resetCheckout() {
      return initialState;
    },
    updateFreeDelivery (state, action: PayloadAction<number>) {
      state.isFreeDelivery = action.payload >= 1000;
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
      });
  },
});

export const {
  setStep,
  completeStep,
  setContactInfo,
  setDeliveryInfo,
  setPaymentInfo,
  resetCheckout,
  updateFreeDelivery,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
