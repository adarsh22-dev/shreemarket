import { getProduct, getVendorById, getAllProducts, getProductReviews } from '@/lib/api/server';
import { BACKEND_URL, getProductImageUrl, isValidProduct } from '@/lib/api/shared';
import ProductPageClient from './ProductPageClient';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    const product = await getProduct(id);
    return {
      title: `${product.name} | SreeMarket`,
      description: product.shortDescription || product.description || 'Shop authentic Indian handmade products.',
      openGraph: {
        images: [getProductImageUrl(product.media)],
      },
    };
  } catch {
    return { title: 'Product | SreeMarket' };
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  let product = null, vendor = null, relatedProducts = [], reviews = [];

  try {
    product = await getProduct(id);
    const [vendorData, allProducts, reviewsData] = await Promise.all([
      product.vendorId ? getVendorById(product.vendorId).catch(() => null) : null,
      getAllProducts().catch(() => []),
      getProductReviews(id).catch(() => []),
    ]);
    vendor = vendorData;
    reviews = reviewsData || [];
    relatedProducts = (allProducts || [])
      .filter(p => p.category === product.category && p.id !== product.id && isValidProduct(p))
      .slice(0, 4);
  } catch (error) {
    console.error("Failed to load product:", error);
  }

  if (!product) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}><h1>Product not found</h1></div>;
  }

  return (
    <ProductPageClient
      product={product}
      vendor={vendor}
      relatedProducts={relatedProducts}
      initialReviews={reviews}
    />
  );
}
