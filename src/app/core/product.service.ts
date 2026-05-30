import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, Page, Product } from './models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  list(opts: { categoryId?: number; q?: string; page?: number; size?: number } = {}): Observable<Page<Product>> {
    let params = new HttpParams();
    if (opts.categoryId != null) params = params.set('categoryId', opts.categoryId);
    if (opts.q) params = params.set('q', opts.q);
    params = params.set('page', opts.page ?? 0).set('size', opts.size ?? 12);
    return this.http.get<Page<Product>>(`${this.base}/products`, { params });
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  create(body: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, body);
  }

  update(id: number, body: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.base}/products/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  createCategory(name: string, slug: string): Observable<Category> {
    return this.http.post<Category>(`${this.base}/categories`, { name, slug });
  }

  uploadImage(file: File): Observable<{ code: string; url: string; contentType: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ code: string; url: string; contentType: string }>(`${this.base}/images`, fd);
  }
}
