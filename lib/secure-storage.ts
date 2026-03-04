/**
 * Cross-platform secure storage: uses expo-secure-store on native (iOS/Android)
 * and localStorage on web (expo-secure-store is not available on web).
 */

import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

async function nativeGetItem(key: string): Promise<string | null> {
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function nativeSetItem(key: string, value: string): Promise<void> {
  const SecureStore = await import('expo-secure-store');
  return SecureStore.setItemAsync(key, value);
}

async function nativeDeleteItem(key: string): Promise<void> {
  const SecureStore = await import('expo-secure-store');
  return SecureStore.deleteItemAsync(key);
}

function webGetItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function webSetItem(key: string, value: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // quota or privacy
  }
}

function webDeleteItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (IS_WEB) {
    return Promise.resolve(webGetItem(key));
  }
  return nativeGetItem(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (IS_WEB) {
    webSetItem(key, value);
    return Promise.resolve();
  }
  return nativeSetItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (IS_WEB) {
    webDeleteItem(key);
    return Promise.resolve();
  }
  return nativeDeleteItem(key);
}
