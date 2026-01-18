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
    const response = await AuthService.login(data);
    AuthService.saveToken(response.token);
    setToken(response.token);
    const currentUser = await AuthService.getCurrentUser(response.token);
    setUser(currentUser);
  };

  const register = async (data: RegisterRequest) => {
    await AuthService.register(data);
    await login({ email: data.email, password: data.password });
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
