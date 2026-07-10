import { useAuthStore } from '../store/auth';
import { authApi } from '../services/auth';
import { LoginRequest, RegisterRequest } from '../types';
import { storage } from '../services/storage';

export function useAuth() {
  const store = useAuthStore();

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const user = { id: res.userId, fullName: res.fullName, email: data.email, roleId: res.roleId };
    storage.set('user_data', JSON.stringify(user));
    storage.set('user_id', String(res.userId));
    store.setUser(user);
    return res;
  };

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    const user = { id: res.userId, fullName: data.fullName, email: data.email, roleId: 2 };
    storage.set('user_data', JSON.stringify(user));
    storage.set('user_id', String(res.userId));
    store.setUser(user);
    return res;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    storage.delete('user_data');
    storage.delete('user_id');
    store.logout();
  };

  const checkAuth = async () => {
    try {
      const userData = storage.getString('user_data');
      const userId = storage.getString('user_id');
      if (userData && userId) {
        store.setUser(JSON.parse(userData));
      } else {
        store.setLoading(false);
      }
    } catch {
      store.setLoading(false);
    }
  };

  return {
    ...store,
    login,
    register,
    logout,
    checkAuth,
  };
}
