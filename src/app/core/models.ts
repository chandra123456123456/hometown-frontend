export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  effectivePrice: number;
  categoryId: number;
  stock: number;
  active: boolean;
  sellerId: number | null;
  imageUrls: string[];
  avgRating?: number;
  reviewCount?: number;
}

export interface Review {
  id: number;
  productId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Cart {
  userId: number | null;
  items: CartItem[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  name: string;
  email: string;
  role: string;
}

export interface OrderLine {
  productId: number;
  quantity: number;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  sellerId: number | null;
}

export interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  destPincode: string;
  shippingPartner: string;
  shippingCost: number;
  estimatedDeliveryDays: number;
  createdAt: string;
  items: OrderItem[];
}

export interface ShippingOption {
  partner: string;
  serviceable: boolean;
  etaDays: number;
  charge: number;
}

export type EventType = 'PRODUCT_VIEW' | 'CATALOG_VIEW' | 'ADD_TO_CART' | 'CHECKOUT';
