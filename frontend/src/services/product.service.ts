import { API_CONFIG, getAuthHeader } from '../config/api.config';
import {
  ProductRequest,
  ProductResponse,
  ProductAnalysis,
  UpdateQuantityRequest,
  UpdateNotificationFrequencyRequest,
  TagsRequest,
  PageableResponse,
} from '../types/api.types';

export interface ProductListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  // optional filters: multiple values allowed
  statuses?: string[];
  notificationFrequencies?: string[];
}

export class ProductService {
  private static async fetchApi<T>(
    endpoint: string,
    token: string | null,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async createProduct(
    data: ProductRequest,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.BASE,
      token,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  static async getProduct(id: string, token: string): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.BY_ID(id),
      token
    );
  }

  static async analyzeProduct(
      productId: string,
      token: string
  ): Promise<ProductAnalysis> {
    return this.fetchApi<ProductAnalysis>(
        API_CONFIG.ENDPOINTS.PRODUCTS.ANALYZE(productId),
        token
    );
  }


  static async getUserProducts(
    userId: string,
    token: string,
    params?: ProductListParams
  ): Promise<PageableResponse<ProductResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.pageNumber !== undefined)
      queryParams.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize !== undefined)
      queryParams.append('pageSize', params.pageSize.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection)
      queryParams.append('sortDirection', params.sortDirection);
    // append filters (repeat param for multiple values)
    if (params?.statuses) {
      params.statuses.forEach(s => queryParams.append('status', s));
    }
    if (params?.notificationFrequencies) {
      params.notificationFrequencies.forEach(nf => queryParams.append('notificationFrequency', nf));
    }

    const query = queryParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.PRODUCTS.BY_USER(userId)}${
      query ? `?${query}` : ''
    }`;

    return this.fetchApi<PageableResponse<ProductResponse>>(endpoint, token);
  }

  static async updateProduct(
    id: string,
    data: ProductRequest,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.BY_ID(id),
      token,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  static async updateQuantityConsumed(
    id: string,
    data: UpdateQuantityRequest,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.QUANTITY_CONSUMED(id),
      token,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  static async updateNotificationFrequency(
    id: string,
    data: UpdateNotificationFrequencyRequest,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.NOTIFICATION_FREQUENCY(id),
      token,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  static async replaceTags(
    id: string,
    data: TagsRequest,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.TAGS(id),
      token,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  static async addTag(
    id: string,
    tag: string,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      API_CONFIG.ENDPOINTS.PRODUCTS.TAGS(id),
      token,
      {
        method: 'POST',
        body: JSON.stringify({ tags: [tag] }),
      }
    );
  }

  static async removeTag(
    id: string,
    tag: string,
    token: string
  ): Promise<ProductResponse> {
    return this.fetchApi<ProductResponse>(
      `${API_CONFIG.ENDPOINTS.PRODUCTS.TAGS(id)}?tag=${encodeURIComponent(tag)}`,
      token,
      {
        method: 'DELETE',
      }
    );
  }

  static async deleteProduct(id: string, token: string): Promise<void> {
    await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS.BY_ID(id)}`,
      {
        method: 'DELETE',
        headers: getAuthHeader(token),
      }
    );
  }

  static async recomputeStatuses(userId: string, token: string, signal?: AbortSignal): Promise<any> {
    const endpoint = API_CONFIG.ENDPOINTS.PRODUCTS.RECOMPUTE_BY_USER(userId);
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `Failed to recompute statuses: ${response.status}`);
    }

    // try parse JSON, but tolerate empty body
    const text = await response.text();
    try { return text ? JSON.parse(text) : null; } catch(e) { return null; }
  }
}
