import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BasketItem } from "@/types/basket";

type BasketState = {
  items: BasketItem[];
};

const loadBasketFromStorage = (): BasketItem[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem("basket");
    return data ? JSON.parse(data) : [];
  }
  return [];
};

const initialState: BasketState = {
  items: loadBasketFromStorage(),
};

const saveBasketToStorage = (items: BasketItem[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("basket", JSON.stringify(items));
  }
};

export const basketSlice = createSlice({
  name: "basket",
  initialState,
  reducers: {
    addToBasket: (state, action: PayloadAction<BasketItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      saveBasketToStorage(state.items);
    },
    removeFromBasket: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveBasketToStorage(state.items);
    },
    increaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        saveBasketToStorage(state.items);
      }
    },
    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const itemIndex = state.items.findIndex(
        (item) => item.id === action.payload
      );
      if (itemIndex !== -1) {
        if (state.items[itemIndex].quantity > 1) {
          state.items[itemIndex].quantity -= 1;
        } else {
          state.items.splice(itemIndex, 1);
        }
        saveBasketToStorage(state.items);
      }
    },
    setQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.productId
      );
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
        saveBasketToStorage(state.items);
      }
    },
    clearBasket: (state) => {
      state.items = [];
      saveBasketToStorage([]);
    },
    initBasket: () => {
  // нічого не змінює, просто сигнал для middleware
},
  },
});

export const {
  addToBasket,
  removeFromBasket,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  clearBasket,
  initBasket,
} = basketSlice.actions;
export default basketSlice.reducer;
