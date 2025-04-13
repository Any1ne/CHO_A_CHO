export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
};

export type Item = {
  id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  image_urls?: string[];
};
