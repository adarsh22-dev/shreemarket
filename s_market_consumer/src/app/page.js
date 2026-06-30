import { getAllProducts, getTopDeals, getTrendingProducts, getCategories } from '@/lib/api/server';
import { BACKEND_URL, isValidProduct } from '@/lib/api/shared';
import HomePageClient from './HomePageClient';

export const revalidate = 300;

const CATEGORY_IMAGE_MAP = {
  'grocery & gourmet food': '/assets/Grocery_&_Gourmet_Food.svg',
  'grocery': '/assets/Grocery_&_Gourmet_Food.svg',
  'health & household': '/assets/Health_&_Household.svg',
  'health': '/assets/Health_&_Household.svg',
  'home & kitchen': '/assets/Home_&_Kitchen.svg',
  'home': '/assets/Home_&_Kitchen.svg',
  'beauty & personal care': '/assets/Beauty_&_Personal_Care.svg',
  'beauty': '/assets/Beauty_&_Personal_Care.svg',
  'clothing, shoes & jewellery': '/assets/Clothing_Shoes_Jewellery.svg',
  'clothing': '/assets/Clothing_Shoes_Jewellery.svg',
  'toys & games': '/assets/Toys_&_Games.svg',
  'toys': '/assets/Toys_&_Games.svg',
  'patio, lawn & garden': '/assets/Patio_Lawn_&_Garden.svg',
  'patio': '/assets/Patio_Lawn_&_Garden.svg',
  'musical instruments': '/assets/Musical_Instruments.svg',
  'musical': '/assets/Musical_Instruments.svg',
  'arts & crafts': '/assets/Arts_Crafts.svg',
  'arts': '/assets/Arts_Crafts.svg',
};

function computeTopDealsFallback(products) {
  const sorted = [...products].sort((a, b) => {
    const getDiscount = (p) => {
      if (!p.regularPrice || !p.discountPrice || p.regularPrice <= p.discountPrice) return 0;
      return ((p.regularPrice - p.discountPrice) / p.regularPrice) * 100;
    };
    return getDiscount(b) - getDiscount(a);
  });
  const top3 = sorted.slice(0, 3);
  const reordered = [];
  if (top3.length > 0) reordered[1] = top3[0];
  if (top3.length > 1) reordered[0] = top3[1];
  if (top3.length > 2) reordered[2] = top3[2];
  return reordered.filter(Boolean);
}

function computeFeatured(products) {
  const sorted = [...products].sort((a, b) => {
    const getDiscount = (p) => {
      if (!p.regularPrice || !p.discountPrice || p.regularPrice <= p.discountPrice) return 0;
      return ((p.regularPrice - p.discountPrice) / p.regularPrice) * 100;
    };
    return getDiscount(b) - getDiscount(a);
  });
  return sorted.length > 7 ? sorted.slice(7, 11) : sorted.slice(0, 4);
}

// Null function — replaced by backend API call below
function computeTrendingFallback(products) {
  return [...products].sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0)).slice(0, 12);
}

function computeNewArrivals(products) {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Filter: created within last 3 days, has image, has price, in stock
  return (products || []).filter(p => {
    const createdAt = p.createdAt ? (typeof p.createdAt === 'number' ? p.createdAt : Number(p.createdAt)) : 0;
    const isRecent = (now - createdAt) <= THREE_DAYS_MS;
    if (!isRecent) return false;

    // Must have at least one image with a valid fileName
    const hasImage = p.media && p.media.length > 0 && p.media.some(m => m.fileName);
    // Must have a meaningful price (≥ ₹1 minimum — prevents ₹0.00 display from rounding)
    const hasPrice = (p.regularPrice && p.regularPrice >= 1) || (p.discountPrice && p.discountPrice >= 1);
    // Must be in stock
    const inStock = p.status !== 'out' && (p.initialStock === null || p.initialStock === undefined || p.initialStock > 0);

    return hasImage && hasPrice && inStock;
  })
  .sort((a, b) => {
    // Sort by category performance (bookingCount), then newest first
    const perfA = a.bookingCount || 0;
    const perfB = b.bookingCount || 0;
    if (perfB !== perfA) return perfB - perfA;
    return (b.createdAt || 0) - (a.createdAt || 0);
  })
  .slice(0, 12);
}

function processCategories(cats, products) {
  const adminCats = (cats || [])
    .filter(cat => cat.status === 'Active')
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      image: cat.image
        ? (cat.image.startsWith('/uploads') ? `${BACKEND_URL}${cat.image}` : cat.image)
        : CATEGORY_IMAGE_MAP[cat.name.toLowerCase()] || null,
    }));
  const productCatNames = [...new Set((products || []).map(p => p.category).filter(Boolean))];
  const adminCatNames = new Set(adminCats.map(c => c.name.toLowerCase()));
  const merged = [...adminCats];
  for (const name of productCatNames) {
    const lower = name.toLowerCase();
    if (!adminCatNames.has(lower)) {
      merged.push({
        id: null,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        image: CATEGORY_IMAGE_MAP[lower] || null,
      });
    }
  }
  return merged;
}

export default async function HomePage() {
  let products = [];
  let categories = [];
  let newArrivals = [];
  let topDeals = [];
  let trending = [];

  try {
    const [allProductsData, topDealsData, trendingData, categoriesData] = await Promise.all([
      getAllProducts(),
      getTopDeals().catch(() => null),
      getTrendingProducts().catch(() => null),
      getCategories().catch(() => []),
    ]);
    products = allProductsData || [];
    categories = categoriesData || [];
    topDeals = topDealsData || [];
    trending = trendingData || [];
  } catch (error) {
    console.error("Failed to load homepage data:", error);
  }

  // Filter out invalid products for all homepage sections
  const validProducts = (products || []).filter(isValidProduct);

  // Use backend-computed top deals (discounted products sold in last 3 days). Fallback to client-side if API fails.
  if (topDeals.length === 0) {
    topDeals = computeTopDealsFallback(validProducts);
  }
  // Use backend-computed trending (actual sales from last 3 days). Fallback to all-time bookingCount if API fails.
  if (trending.length === 0) {
    trending = computeTrendingFallback(validProducts);
  }
  const featured = computeFeatured(validProducts);
  newArrivals = computeNewArrivals(validProducts);
  const dynamicCategories = processCategories(categories, products);

  return (
    <HomePageClient
      topDeals={topDeals}
      trendingProducts={trending}
      featuredProducts={featured}
      newArrivals={newArrivals}
      dynamicCategories={dynamicCategories}
    />
  );
}
