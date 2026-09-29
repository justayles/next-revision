export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  body: string;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  qty: number;
};

export type ActionState = {
  error: string | null;
};
