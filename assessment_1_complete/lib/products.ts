import { Product } from './types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Aero Mug',
    price: 24,
    description: 'Double-wall ceramic mug that keeps coffee warm on long standups.',
    category: 'home',
    image: 'https://picsum.photos/id/225/640/420',
    stock: 18,
  },
  {
    id: '2',
    name: 'Nimbus Notebook',
    price: 18,
    description: 'Dot-grid notebook with a lay-flat binding for architecture sketches.',
    category: 'stationery',
    image: 'https://picsum.photos/id/24/640/420',
    stock: 40,
  },
  {
    id: '3',
    name: 'Orbit Lamp',
    price: 89,
    description: 'Adjustable desk lamp with a warm/cool toggle for late-night reviews.',
    category: 'home',
    image: 'https://picsum.photos/id/36/640/420',
    stock: 7,
  },
  {
    id: '4',
    name: 'Pulse Headphones',
    price: 129,
    description: 'Over-ear headphones with a quiet office mode and USB-C charging.',
    category: 'audio',
    image: 'https://picsum.photos/id/1080/640/420',
    stock: 11,
  },
  {
    id: '5',
    name: 'Canvas Tote',
    price: 32,
    description: 'Heavy canvas tote that fits a 14" laptop and a water bottle.',
    category: 'bags',
    image: 'https://picsum.photos/id/1011/640/420',
    stock: 25,
  },
  {
    id: '6',
    name: 'Field Bottle',
    price: 28,
    description: 'Insulated bottle that holds 750ml and does not sweat on your desk.',
    category: 'home',
    image: 'https://picsum.photos/id/1060/640/420',
    stock: 0,
  },
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(id: string) {
  const current = getProduct(id);
  if (!current) return [];

  return products.filter(
    (product) => product.category === current.category && product.id !== id,
  );
}

export async function getRelatedProductsAsync(id: string) {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return getRelatedProducts(id);
}
