import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthUser, JwtPayload } from '../types/auth';

export const TOKEN_KEY = 'jwt_token';

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function triggerUnauthorized() {
  onUnauthorized?.();
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);

    if (!payload.sub || !payload.name || !payload.role) {
      return null;
    }

    return {
      userId: payload.sub,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const token = await getToken();

  if (!token) {
    return null;
  }

  if (!isTokenValid(token)) {
    await clearToken();
    return null;
  }

  const user = decodeToken(token);

  if (!user) {
    await clearToken();
    return null;
  }

  return user;
}
