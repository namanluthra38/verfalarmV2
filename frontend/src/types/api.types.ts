export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: string;
}

export interface UserResponse {
  id: string;
  email: string;
  roles: string[];
  enabled: boolean;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  displayName: string;
}

export type NotificationFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ProductRequest {
  name: string;
  quantityBought: number;
  quantityConsumed: number;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  notificationFrequency?: NotificationFrequency;
  tags?: string[];
}

export interface ProductResponse {
  id: string;
  userId: string;
  name: string;
  quantityBought: number;
  quantityConsumed: number;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  createdAt: string;
  updatedAt: string;
  status: ProductStatus;
  notificationFrequency?: NotificationFrequency;
  tags?: string[];
}

export type ProductStatus =
    | 'AVAILABLE'
    | 'FINISHED'
    | 'EXPIRED';

export interface ProductAnalysis {
  remainingQuantity: number;
  percentConsumed: number;
  percentRemaining: number;

  daysUntilExpiration: number | null;
  monthsUntilExpiration: number | null;
  yearsUntilExpiration: number | null;

  isExpired: boolean;

  recommendedDailyToFinish: number | null;
  recommendedMonthlyToFinish: number | null;
  currentAvgDailyConsumption: number | null;

  estimatedFinishDate: string | null;
  estimatedDaysToFinishFromNow: number | null;

  daysSincePurchase?: number;

  statusSuggestion: ProductStatus;
  summary: string;
  warnings?: string[];
}


export interface UpdateQuantityRequest {
  quantityConsumed: number;
}

export interface UpdateNotificationFrequencyRequest {
  notificationFrequency: NotificationFrequency;
}

export interface TagsRequest {
  tags: string[];
}

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
}
