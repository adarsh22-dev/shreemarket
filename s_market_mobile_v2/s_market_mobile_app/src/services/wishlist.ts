import { api } from '../api/client';
import { WishlistItem } from '../types';

export const wishlistApi = {
  get: (userId: number) =>
    api.get<WishlistItem[]>(`/wishlist/${userId}`).then((r) => r.data),

  add: (userId: number, productId: number) =>
    api.post(`/wishlist/${userId}/add/${productId}`).then((r) => r.data),

  remove: (userId: number, productId: number) =>
    api.delete(`/wishlist/${userId}/remove/${productId}`).then((r) => r.data),

  check: (userId: number, productId: number) =>
    api.get<boolean>(`/wishlist/${userId}/check/${productId}`).then((r) => r.data),
};
