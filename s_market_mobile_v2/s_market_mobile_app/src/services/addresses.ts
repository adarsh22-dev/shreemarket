import { api } from '../api/client';
import { Address } from '../types';

export const addressesApi = {
  getUserAddresses: (userId: number) =>
    api.get<Address[]>(`/addresses/user/${userId}`).then((r) => r.data),

  getById: (id: number, userId: number) =>
    api.get<Address>(`/addresses/${id}/user/${userId}`).then((r) => r.data),

  create: (data: Omit<Address, 'id'>) =>
    api.post<Address>('/addresses', data).then((r) => r.data),

  update: (id: number, userId: number, data: Partial<Address>) =>
    api.put<Address>(`/addresses/${id}/user/${userId}`, data).then((r) => r.data),

  delete: (id: number, userId: number) =>
    api.delete(`/addresses/${id}/user/${userId}`),

  setDefault: (id: number, userId: number) =>
    api.patch<Address>(`/addresses/${id}/default/user/${userId}`).then((r) => r.data),
};
