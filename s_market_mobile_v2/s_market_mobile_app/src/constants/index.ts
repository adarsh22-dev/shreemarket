import { Platform } from 'react-native';

/**
 * Your machine's LAN IP — needed for real devices to reach the backend.
 * Find it with: hostname -I  (Linux/macOS) or ipconfig (Windows)
 */
const DEVICE_HOST = '10.31.1.84';

const API_HOST = Platform.select({
  web: typeof window !== 'undefined' ? window.location.hostname : DEVICE_HOST,
  default: DEVICE_HOST,
});

const API_PORT = '8082';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;
export const MEDIA_BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ONBOARDING_DONE: 'onboarding_done',
};

export const IS_WEB = Platform.OS === 'web';

export const SHADOW = IS_WEB
  ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
  : { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 };
