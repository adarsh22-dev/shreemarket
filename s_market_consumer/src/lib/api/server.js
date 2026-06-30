import { cookies } from 'next/headers';
import { API_BASE_URL, parseJsonResponse } from './shared';

async function serverFetch(path, options = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...options.headers,
    },
    cache: options.cache || 'no-store',
  });

  return parseJsonResponse(response);
}

export const getAllProducts = async () => {
  return serverFetch('/products');
};

export const getTopDeals = async () => {
  return serverFetch('/products/top-deals');
};

export const getTrendingProducts = async () => {
  return serverFetch('/products/trending');
};

export const getNewArrivals = async () => {
  return serverFetch('/products/new-arrivals');
};

export const getProduct = async (productId) => {
  return serverFetch(`/products/single/${productId}`);
};

export const searchProducts = async (query) => {
  return serverFetch(`/products/search?q=${encodeURIComponent(query)}`);
};

export const getCategories = async () => {
  try {
    return await serverFetch('/admin/categories');
  } catch (error) {
    // If we get an unauthorized error, return empty array for public homepage
    // This prevents redirecting to login when just trying to load homepage categories
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      console.warn('Unauthorized access to categories endpoint, returning empty array for homepage');
      return [];
    }
    // Re-throw other errors
    throw error;
  }
};

export const getSubCategories = async () => {
  return serverFetch('/admin/categories/subcategories');
};

export const getVendorById = async (vendorId) => {
  return serverFetch(`/vendors/${vendorId}`);
};

export const getVendors = async (search = "", page = 0, size = 10, sortBy = "createdAt", sortDir = "desc") => {
  const params = new URLSearchParams({ page, size, sortBy, sortDir });
  if (search) params.append("search", search);
  return serverFetch(`/vendors?${params.toString()}`);
};

export const getProductReviews = async (productId) => {
  return serverFetch(`/reviews/product/${productId}`);
};
