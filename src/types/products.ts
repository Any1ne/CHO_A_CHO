export type ProductType = {
  id: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
};

export type BasketItemType = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  images?: string;
};
