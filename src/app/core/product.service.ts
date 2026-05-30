import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, Page, Product, Review } from './models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  list(opts: {
    categoryId?: number;
    q?: string;
    page?: number;
    size?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sort?: string;
    antique?: boolean;
  } = {}): Observable<Page<Product>> {
    let params = new HttpParams();
    if (opts.categoryId != null) params = params.set('categoryId', opts.categoryId);
    if (opts.q) params = params.set('q', opts.q);
    if (opts.minPrice != null) params = params.set('minPrice', opts.minPrice);
    if (opts.maxPrice != null) params = params.set('maxPrice', opts.maxPrice);
    if (opts.inStock) params = params.set('inStock', 'true');
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.antique) params = params.set('antique', 'true');
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

  getReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/products/${productId}/reviews`);
  }

  addReview(productId: number, rating: number, comment: string): Observable<Review> {
    return this.http.post<Review>(`${this.base}/products/${productId}/reviews`, { rating, comment });
  }

  createCategory(name: string, slug: string): Observable<Category> {
    return this.http.post<Category>(`${this.base}/categories`, { name, slug });
  }

  uploadImage(file: File): Observable<{ code: string; url: string; previewUrl: string; contentType: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ code: string; url: string; previewUrl: string; contentType: string }>(`${this.base}/images`, fd);
  }
}
