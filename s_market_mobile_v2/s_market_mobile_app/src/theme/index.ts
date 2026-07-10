export const colors = {
  primary: '#FF5722',
  primaryLight: '#FF8A65',
  primaryDark: '#E64A19',

  secondary: '#6B3FA0',
  secondaryLight: '#9C6FD8',

  vendor: '#FF5722',
  wholesaler: '#2E7D32',

  background: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#F0F0F0',

  text: '#1A1A1A',
  textSecondary: '#888888',
  textLight: '#BBBBBB',
  textInverse: '#FFFFFF',

  success: '#2E7D32',
  warning: '#FFA000',
  error: '#D32F2F',
  info: '#1565C0',

  dot: '#E0E0E0',
  dotActive: '#FF5722',

  cardBackground: '#FFFFFF',
  cardBorder: '#F3F4F6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 24 },
  caption: { fontSize: 13, color: colors.textSecondary },
  button: { fontSize: 17, fontWeight: '700' as const },
  // Custom font sizes from web reference
  fontSize12: { fontSize: 12 },
  fontSize10: { fontSize: 10 },
};

export const gaps = {
  gap4: 4,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  full: 999,
};
