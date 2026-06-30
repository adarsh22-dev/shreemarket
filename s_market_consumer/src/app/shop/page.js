import { getAllProducts } from '@/lib/api/server';
import ShopPageClient from './ShopPageClient';

export const revalidate = 300;

export const metadata = {
  title: 'Shop - SreeMarket',
  description: 'Browse our collection of authentic Indian handmade products.',
};

export default async function ShopPage({ searchParams }) {
  let products = [];
  try {
    products = await getAllProducts();
  } catch (error) {
    console.error("Failed to load products:", error);
  }

  const params = await searchParams;
  return (
    <ShopPageClient
      products={products || []}
      initialCategory={params?.category || 'All'}
      initialSearch={params?.search || ''}
    />
  );
}
