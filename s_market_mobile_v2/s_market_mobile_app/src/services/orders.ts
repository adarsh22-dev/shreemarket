import { api } from '../api/client';
import { Order, CreateOrderRequest } from '../types';

export const ordersApi = {
  create: (data: CreateOrderRequest) =>
    api.post<Order>('/orders', data).then((r) => r.data),

  getUserOrders: (userId: number) =>
    api.get<Order[]>(`/orders/user/${userId}`).then((r) => r.data),

  trackOrder: (orderNumber: string) =>
    api.get<Order>(`/orders/track/${orderNumber}`).then((r) => r.data),

  cancel: (orderId: number) =>
    api.post<Order>(`/orders/${orderId}/cancel`).then((r) => r.data),
};
