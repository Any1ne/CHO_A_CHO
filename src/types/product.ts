export type ProductType = {
  id: string;
  title: string;
  description?: string;
  flavour?: string;
  category?: string;
  price: number;
  preview: string;
  weight?: number;
};