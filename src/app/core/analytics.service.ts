import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventType } from './models';

const SESSION_KEY = 'ht_session_id';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/analytics`;

  // Fire-and-forget visit tracking; never blocks the UI.
  track(type: EventType, opts: { productId?: number; sellerId?: number; category?: string } = {}): void {
    const body = {
      type,
      productId: opts.productId ?? null,
      sellerId: opts.sellerId ?? null,
      category: opts.category ?? null,
      userId: null,
      guest: true,
      sessionId: this.sessionId(),
      referrer: document.referrer || null,
    };
    this.http.post(`${this.base}/events`, body).subscribe({ error: () => {} });
  }

  sellerSummary(sellerId: number): Observable<any> {
    return this.http.get(`${this.base}/seller/${sellerId}/summary`);
  }

  topProducts(limit = 10): Observable<{ productId: number; views: number }[]> {
    return this.http.get<{ productId: number; views: number }[]>(`${this.base}/products/top?limit=${limit}`);
  }

  private sessionId(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }
}
