export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      ME: '/api/auth/me',
    },
    USERS: {
      BASE: '/api/users',
      BY_ID: (id: string) => `/api/users/${id}`,
    },
    PRODUCTS: {
      BASE: '/api/products',
      BY_ID: (id: string) => `/api/products/${id}`,
      ANALYZE: (id: string) => `/api/products/analyze/${id}`,
      BY_USER: (userId: string) => `/api/products/user/${userId}`,
      QUANTITY_CONSUMED: (id: string) => `/api/products/${id}/quantity-consumed`,
      NOTIFICATION_FREQUENCY: (id: string) => `/api/products/${id}/notification-frequency`,
      TAGS: (id: string) => `/api/products/${id}/tags`,
    },
  },
};

export const getAuthHeader = (token: string | null): Record<string, string> => {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};
