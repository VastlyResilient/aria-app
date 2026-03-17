import { Platform } from 'react-native';

export const colors = {
  gold: '#c9a96e',
  bg: '#090910',
  surface: '#0e0e18',
  border: '#1c1c2e',
  muted: '#6b6b8a',
  green: '#4a9a6a',
  text: '#e8e4dc',
  dim: '#3a3a5a',
};

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
