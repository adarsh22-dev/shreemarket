export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8082/api";

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');

export const getProductImageUrl = (media) => {
  if (!media || media.length === 0) return "https://placehold.co/800x800?text=No+Image";
  const primaryMedia = media.find(m => m.isPrimary) || media[0];
  return `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`;
};

/**
 * Check if a product has a valid image, meaningful price (≥ ₹1), and is in stock.
 * Use this filter in any page/component that displays products to customers.
 */
export const isValidProduct = (p) => {
  if (!p) return false;
  // Must have at least one image with a valid fileName
  const hasImage = p.media && p.media.length > 0 && p.media.some(m => m.fileName);
  // Must have a meaningful price (≥ ₹1 minimum — prevents ₹0.00 display from rounding)
  const hasPrice = (p.regularPrice && p.regularPrice >= 1) || (p.discountPrice && p.discountPrice >= 1);
  // Must be in stock
  const inStock = p.status !== 'out' && (p.initialStock === null || p.initialStock === undefined || p.initialStock > 0);
  return hasImage && hasPrice && inStock;
};

export const parseJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON parsing error:", e);
        throw new Error("Invalid server response format");
      }
    }
  }

  if (!response.ok) {
    throw new Error((data && data.error) || data?.message || `HTTP Error ${response.status}`);
  }
  return data;
};
