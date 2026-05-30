import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderLine, ShippingOption } from './models';

export interface CreateOrderRequest {
  items: OrderLine[];
  shippingAddress: string;
  destPincode: string;
  shippingPartner: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/orders`;

  create(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.base, req);
  }

  list(): Observable<Order[]> {
    return this.http.get<Order[]>(this.base);
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  listAll(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/admin/all`);
  }

  updateStatus(orderId: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.base}/admin/status`, { orderId, status });
  }

  validateStock(items: { productId: number; quantity: number }[]): Observable<{
    ok: boolean;
    issues: { productId: number; requested: number; available: number }[];
  }> {
    return this.http.post<{
      ok: boolean;
      issues: { productId: number; requested: number; available: number }[];
    }>(`${this.base}/validate-stock`, { items });
  }

  shippingQuote(items: { productId: number; quantity: number }[], pincode: string): Observable<ShippingOption[]> {
    return this.http.post<ShippingOption[]>(`${this.base}/shipping-quote`, { items, pincode });
  }
}
