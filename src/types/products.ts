export type ProductType = {
  id: string;
  title: string;
  description: string;
  flavour?: string;
  category?: string;
  price: number;
  preview?: string;
};

export type BasketItemType = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  preview?: string;
};

export type FormData = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  deliveryMethod: "branch" | "address";
  branchNumber?: string;
  address?: string;
  paymentMethod: "cod" | "monobank";
};
