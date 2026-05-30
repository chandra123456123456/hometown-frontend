import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CustomOrder {
  id: number;
  userId: number;
  customerName: string;
  customerPhone: string;
  type: string;
  description: string;
  status: string;
  quotedPrice: number | null;
  deliveryDate: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomOrderService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/custom-orders`;

  create(body: { type: string; description: string; customerName: string; customerPhone: string }): Observable<CustomOrder> {
    return this.http.post<CustomOrder>(this.base, body);
  }

  mine(): Observable<CustomOrder[]> {
    return this.http.get<CustomOrder[]>(this.base);
  }

  adminAll(): Observable<CustomOrder[]> {
    return this.http.get<CustomOrder[]>(`${this.base}/admin/all`);
  }

  adminUpdate(body: { id: number; description?: string; status?: string; quotedPrice?: number; deliveryDate?: string; adminNotes?: string }): Observable<CustomOrder> {
    return this.http.put<CustomOrder>(`${this.base}/admin/update`, body);
  }
}
