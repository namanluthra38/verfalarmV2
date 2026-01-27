import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/auth.service';
import { UserResponse, LoginRequest, RegisterRequest } from '../types/api.types';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = AuthService.getToken();
      if (savedToken) {
        try {
          const currentUser = await AuthService.getCurrentUser(savedToken);
          setUser(currentUser);
          setToken(savedToken);
        } catch (error) {
          AuthService.removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await AuthService.login(data);

      // If AuthService.login returns an object with status, handle 403 explicitly.
      // Many service helpers throw on non-2xx; we defensively check for a status field.
      // Do NOT save token if login was rejected (e.g., 403 email not verified)
      // AuthService.login is expected to either return { token, ... } or throw.

      // If response looks like an error wrapper with status
      if ((response as any).status === 403) {
        throw new Error('Email not verified. Please check your inbox for a verification link.');
      }

      // Normal successful flow
      AuthService.saveToken((response as any).token);
      setToken((response as any).token);
      const currentUser = await AuthService.getCurrentUser((response as any).token);
      setUser(currentUser);
    } catch (err: any) {
      // Try to detect a 403 coming from the service helper if it threw an error with status
      if (err && (err.status === 403 || String(err).includes('403') || String(err).toLowerCase().includes('not verified') || String(err).toLowerCase().includes('email'))) {
        // Ensure we don't keep any token
        AuthService.removeToken();
        setToken(null);
        setUser(null);
        throw new Error('Email not verified. Please check your inbox for a verification link.');
      }

      // For any other error, rethrow so the UI can display it
      AuthService.removeToken();
      setToken(null);
      setUser(null);
      throw err;
    }
  };

  // Changed: do NOT auto-login after register. Registration now returns and frontend should prompt user to verify email.
  const register = async (data: RegisterRequest) => {
    await AuthService.register(data);
    // Do not call login here automatically because backend sends a verification email and user must verify before login.
    // Return so calling UI can redirect to a "check your email" page or show instructions.
  };

  const logout = () => {
    AuthService.removeToken();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
