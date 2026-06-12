import axios from 'axios';
import {
  clearToken,
  getToken,
  triggerUnauthorized,
} from '../services/authService';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://petercare.onrender.com';

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
