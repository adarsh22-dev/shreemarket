import { Platform } from 'react-native';

const webStorage = Platform.OS === 'web' ? localStorage : null;

export const storage = {
  getString(key: string): string | null {
    if (webStorage) return webStorage.getItem(key);
    return null;
  },

  set(key: string, value: string): void {
    if (webStorage) webStorage.setItem(key, value);
  },

  delete(key: string): void {
    if (webStorage) webStorage.removeItem(key);
  },
};
