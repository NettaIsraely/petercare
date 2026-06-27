import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import { AppState, type AppStateStatus } from 'react-native';
import { apiClient } from '../api/client';
import {
  clearToken,
  decodeToken,
  getSession,
  setToken,
  setUnauthorizedHandler,
} from '../services/authService';
import { AuthUser } from '../types/auth';
import { registerPushToken, syncUserTimezone } from '../services/pushNotificationService';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  updateLocalUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...partial } : current));
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    const response = await apiClient.post('/auth/refresh');
    const token = response.data.access_token;
    const decodedUser = decodeToken(token);

    if (!decodedUser) {
      throw new Error('Invalid token received from server.');
    }

    await setToken(token);
    setUser(decodedUser);
    return decodedUser;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });

    const token = response.data.access_token;
    const decodedUser = decodeToken(token);

    if (!decodedUser) {
      throw new Error('Invalid token received from server.');
    }

    await setToken(token);
    setUser(decodedUser);
    void syncUserTimezone(decodedUser.userId);
    void registerPushToken(decodedUser.userId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const session = await getSession();
        if (!session) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        try {
          const refreshedUser = await refreshSession();
          if (isMounted && refreshedUser) {
            void syncUserTimezone(refreshedUser.userId);
            void registerPushToken(refreshedUser.userId);
          }
        } catch (error) {
          const is401 =
            axios.isAxiosError(error) && error.response?.status === 401;
          if (isMounted && !is401) {
            setUser(session);
            void syncUserTimezone(session.userId);
            void registerPushToken(session.userId);
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        return;
      }

      const session = userRef.current;
      if (session) {
        void registerPushToken(session.userId);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshSession,
      updateLocalUser,
    }),
    [user, isLoading, login, logout, refreshSession, updateLocalUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
