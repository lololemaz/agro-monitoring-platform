import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { getStoredToken } from '@/services/api';
import type { User, LoginRequest } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperuser: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;
  const isSuperuser = user?.is_superuser ?? false;

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      try {
        const verifiedUser = await authService.verifyToken();
        if (verifiedUser) {
          setUser(verifiedUser);
          setToken(getStoredToken());
        } else {
          setUser(null);
          setToken(null);
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const { token: newToken, user: newUser } = await authService.login(credentials);
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const refreshedUser = await authService.getMe();
      setUser(refreshedUser);
    } catch {
      // If refresh fails, logout
      logout();
    }
  }, [token, logout]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    isSuperuser,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to navigate based on user role after login
 */
export function useAuthNavigation() {
  const navigate = useNavigate();
  const { user, isSuperuser } = useAuth();

  const navigateAfterLogin = useCallback(() => {
    if (isSuperuser) {
      navigate('/admin');
    } else {
      navigate('/farm');
    }
  }, [navigate, isSuperuser]);

  return { navigateAfterLogin };
}
