export type FlavourItem = {
  id: string;
  flavour: string;
};

export type ProductType = {
  id: string;
  title: string;                // використовуємо title замість name
  description?: string;
  shortDescription?: string;
  flavour?: string;
  category?: string;
  price: number;
  wholesale_price: number;
  preview?: string;             // preview image (single)
  images?: string[];            // optional array of images
  weight?: number;
  gtin?: string;
  mpn?: string;
  sku?: string;
  currency?: string;
  brand?: string;
  inStock?: boolean;
  flavours?: FlavourItem[];     // optional list of flavours
};
