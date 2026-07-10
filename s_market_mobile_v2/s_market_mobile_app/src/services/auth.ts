import { api } from '../api/client';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>('/register', data).then((r) => r.data),

  logout: () => api.post('/logout'),

  forgotPassword: (email: string) =>
    api.post('/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/reset-password', { token, password }).then((r) => r.data),

  getUser: (id: number) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  updateUser: (id: number, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),

  verifyEmail: (code: string) =>
    api.post('/verify-email', { code }).then((r) => r.data),

  registerVendor: (data: any) =>
    api.post('/register/vendor', data).then((r) => r.data),

  changePassword: (id: number, currentPassword: string, newPassword: string) =>
    api.put(`/users/${id}/password`, { currentPassword, newPassword }).then((r) => r.data),

  deleteAccount: (id: number, password: string) =>
    api.delete(`/users/${id}`, { data: { password } }).then((r) => r.data),
};
