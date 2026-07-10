import { Product } from '../types';
import { MEDIA_BASE_URL } from '../constants';

export function getProductImageUrl(product: Product, size: number = 400): string {
  const img = product.media?.find(m => m.isPrimary && m.fileName) || product.media?.find(m => m.fileName);
  if (!img?.fileName) return `https://placehold.co/${size}x${size}/eee/999?text=No+Image`;
  if (img.fileName.startsWith('http')) return img.fileName;
  if (img.fileName.startsWith('/')) return `${MEDIA_BASE_URL}${img.fileName}`;
  return `${MEDIA_BASE_URL}/uploads/products/${img.fileName}`;
}

export function getProductPrice(product: Product): number {
  return product.discountPrice ?? product.regularPrice;
}

export function getDiscountPercent(product: Product): number {
  if (!product.discountPrice || product.discountPrice >= product.regularPrice) return 0;
  return Math.round((1 - product.discountPrice / product.regularPrice) * 100);
}
