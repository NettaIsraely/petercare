import axios from 'axios';
import {
  clearToken,
  getToken,
  triggerUnauthorized,
} from '../services/authService';
import { getActiveApiActionContext } from './apiActionContext';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://petercare.onrender.com';

function createRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Request-Id'] = createRequestId();

  const actionContext = getActiveApiActionContext();
  if (actionContext) {
    config.headers['X-Client-Action-Id'] = actionContext.actionId;
    config.headers['X-Client-Context'] = actionContext.context;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      triggerUnauthorized();
    }

    return Promise.reject(error);
  }
);
