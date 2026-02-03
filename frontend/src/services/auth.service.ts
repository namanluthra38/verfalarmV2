import { API_CONFIG } from '../config/api.config';
import { LoginRequest, RegisterRequest, AuthResponse, UserResponse } from '../types/api.types';

export class AuthService {
  private static async fetchApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Read body once as text, then attempt to parse JSON from it
      const text = await response.text();
      // Try parse JSON
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (e) {
        parsed = null;
      }

      const msgFromJson = parsed && (parsed.message || parsed.error || parsed.msg);
      const friendly = msgFromJson || text || response.statusText || `HTTP error ${response.status}`;
      throw new Error(friendly);
    }

    // Successful: read as JSON and return
    return response.json();
  }

  static async register(data: RegisterRequest): Promise<UserResponse> {
    return this.fetchApi<UserResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    return this.fetchApi<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getCurrentUser(token: string): Promise<UserResponse> {
    return this.fetchApi<UserResponse>(API_CONFIG.ENDPOINTS.AUTH.ME, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static saveToken(token: string): void {
    localStorage.setItem('verfalarm_token', token);
  }

  static getToken(): string | null {
    return localStorage.getItem('verfalarm_token');
  }

  static removeToken(): void {
    localStorage.removeItem('verfalarm_token');
  }
}
