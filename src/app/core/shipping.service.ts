import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShippingOption } from './models';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/shipping`;

  serviceability(pincode: string): Observable<{ pincode: string; serviceable: boolean }> {
    const params = new HttpParams().set('pincode', pincode);
    return this.http.get<{ pincode: string; serviceable: boolean }>(`${this.base}/serviceability`, { params });
  }

  estimate(pincode: string, weight = 500): Observable<ShippingOption> {
    const params = new HttpParams().set('pincode', pincode).set('weight', weight);
    return this.http.get<ShippingOption>(`${this.base}/estimate`, { params });
  }

  quotes(pincode: string, weightGrams = 500): Observable<ShippingOption[]> {
    return this.http.post<ShippingOption[]>(`${this.base}/quotes`, { pincode, weightGrams });
  }
}
