import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient } from '../api/client';
import {
  clearToken,
  decodeToken,
  getSession,
  setToken,
  setUnauthorizedHandler,
} from '../services/authService';
import { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...partial } : current));
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const session = await getSession();
        if (isMounted) {
          setUser(session);
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
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      updateLocalUser,
    }),
    [user, isLoading, login, logout, updateLocalUser]
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
