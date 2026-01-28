import { API_CONFIG } from '../config/api.config';
import { UpdateDisplayNameRequest, UpdatePasswordRequest, UserResponse } from '../types/api.types';

export class UserService {
  private static async fetchApi<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || `HTTP error: ${response.status}`);
    }
    return response.status === 204 ? ({} as T) : response.json();
  }

  static async updateDisplayName(userId: string, data: UpdateDisplayNameRequest, token: string): Promise<UserResponse> {
    // endpoint: PATCH /api/users/{id}/displayName
    const endpoint = `${API_CONFIG.ENDPOINTS.USERS.BY_ID(userId)}/displayName`;
    return this.fetchApi<UserResponse>(endpoint, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async updatePassword(userId: string, data: UpdatePasswordRequest, token: string): Promise<void> {
    // endpoint: PATCH /api/users/{id}/password
    const endpoint = `${API_CONFIG.ENDPOINTS.USERS.BY_ID(userId)}/password`;
    return this.fetchApi<void>(endpoint, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
