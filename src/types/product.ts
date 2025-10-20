export type ProductType = {
  id: string;
  title: string;
  description?: string;
  flavour?: string;
  category?: string;
  price: number;
  wholesale_price: number;
  preview: string;
  weight?: number;
  gtin?: string;
  mpn?: string; 
  brand?: string;
};