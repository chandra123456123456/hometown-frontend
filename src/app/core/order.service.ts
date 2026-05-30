import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderLine } from './models';

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
}
