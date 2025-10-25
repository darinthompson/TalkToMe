import { Platform } from 'react-native';

// Central API base for all network calls
export const API_BASE =
  Platform.OS === 'android'
    ? process.env.EXPO_PUBLIC_API_BASE_ANDROID || 'http://10.0.2.2:3000'
    : Platform.OS === 'web'
      ? process.env.EXPO_PUBLIC_API_BASE_WEB || 'http://localhost:3000'
      : process.env.EXPO_PUBLIC_API_BASE_IOS || 'https://dia-unshrinking-shonda.ngrok-free.dev';

export default API_BASE;