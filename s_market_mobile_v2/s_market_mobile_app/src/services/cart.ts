import { api } from '../api/client';
import { Cart, AddToCartRequest } from '../types';

export const cartApi = {
  get: (userId: number) =>
    api.get<Cart>(`/cart/${userId}`).then((r) => r.data),

  add: (userId: number, data: AddToCartRequest) =>
    api.post<Cart>(`/cart/${userId}/add`, data).then((r) => r.data),

  updateQuantity: (userId: number, itemId: number, quantity: number) =>
    api.put<Cart>(`/cart/${userId}/update/${itemId}`, { quantity }).then((r) => r.data),

  remove: (userId: number, itemId: number) =>
    api.delete<Cart>(`/cart/${userId}/remove/${itemId}`).then((r) => r.data),

  clear: (userId: number) =>
    api.delete(`/cart/${userId}/clear`).then((r) => r.data),

  saveForLater: (userId: number, itemId: number) =>
    api.put<Cart>(`/cart/${userId}/save/${itemId}`).then((r) => r.data),

  moveToCart: (userId: number, itemId: number) =>
    api.put<Cart>(`/cart/${userId}/move-to-cart/${itemId}`).then((r) => r.data),
};
