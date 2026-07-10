import { api } from '../api/client';
import { Product, Category, HomepageSection, Review, Vendor } from '../types';

export const productsApi = {
  getAll: (category?: string) =>
    api.get<Product[]>('/products', { params: { category } }).then((r) => r.data),

  search: (q: string) =>
    api.get<Product[]>('/products/search', { params: { q } }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Product>(`/products/single/${id}`).then((r) => r.data),

  topDeals: () =>
    api.get<Product[]>('/products/top-deals').then((r) => r.data),

  trending: () =>
    api.get<Product[]>('/products/trending').then((r) => r.data),

  featured: () =>
    api.get<Product[]>('/products/featured').then((r) => r.data),

  newArrivals: () =>
    api.get<Product[]>('/products/new-arrivals').then((r) => r.data),

  getCategories: () =>
    api.get<Category[]>('/categories').then((r) => r.data),

  getHomepageSections: () =>
    api.get<HomepageSection[]>('/homepage-sections').then((r) => r.data),

  getProductReviews: (productId: number) =>
    api.get<Review[]>(`/reviews/product/${productId}`).then((r) => r.data),

  submitProductReview: (productId: number, formData: FormData) =>
    api.post<Review>(`/reviews`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  getVendorById: (vendorId: number) =>
    api.get<Vendor>(`/vendors/${vendorId}`).then((r) => r.data),

  /**
   * Fetch linked products (frequently bought together, upsells, cross-sells)
   * by searching for each linked product name in parallel.
   */
  fetchLinkedProducts: async (product: Product, type: 'BOUGHT_TOGETHER' | 'UPSELL' | 'CROSS_SELL'): Promise<Product[]> => {
    if (!product.linkedProducts || product.linkedProducts.length === 0) return [];
    const names = product.linkedProducts
      .filter(lp => lp.linkedType === type)
      .map(lp => lp.linkedProductName);
    if (names.length === 0) return [];

    // Fetch all linked products in parallel
    const searchPromises = names.map(name =>
      api.get<Product[]>('/products/search', { params: { q: name } })
        .then(r => {
          const products = r.data || [];
          const exact = products.find(p => p.name === name) || products[0];
          return exact && exact.id !== product.id ? exact : null;
        })
        .catch(() => null)
    );

    const results = await Promise.all(searchPromises);
    const seen = new Set<number>();
    const unique: Product[] = [];

    for (const p of results) {
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }

    return unique;
  },
};
