import { Platform } from 'react-native';

/**
 * Backend base URL. Set EXPO_PUBLIC_API_URL for real devices. The defaults reach a backend running
 * on this computer: the iOS simulator shares its network, the Android emulator sees it as 10.0.2.2.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
