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
}
