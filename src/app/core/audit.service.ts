import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RequestLog {
  id: number;
  method: string;
  path: string;
  status: number;
  userId: number | null;
  role: string | null;
  durationMs: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/audit/requests`;

  requests(opts: { path?: string; status?: number; limit?: number } = {}): Observable<RequestLog[]> {
    let params = new HttpParams();
    if (opts.path) params = params.set('path', opts.path);
    if (opts.status != null) params = params.set('status', String(opts.status));
    if (opts.limit != null) params = params.set('limit', String(opts.limit));
    return this.http.get<RequestLog[]>(this.base, { params });
  }
}
