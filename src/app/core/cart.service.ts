import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Cart, CartItem } from './models';

const CART_KEY = 'ht_guest_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiBase}/cart`;

  private _items = signal<CartItem[]>(this.readLocal());
  items = this._items.asReadonly();
  count = computed(() => this._items().reduce((n, i) => n + i.quantity, 0));

  async load(): Promise<void> {
    if (this.auth.isAdmin()) {
      this._items.set([]);
      return;
    }
    if (this.auth.isLoggedIn()) {
      const cart = await firstValueFrom(this.http.get<Cart>(this.base));
      this._items.set(cart.items ?? []);
    } else {
      this._items.set(this.readLocal());
    }
  }

  async add(productId: number, quantity = 1): Promise<void> {
    const items = [...this._items()];
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }
    this._items.set(items);
    if (this.auth.isLoggedIn()) {
      await firstValueFrom(this.http.post(`${this.base}/items`, { productId, quantity }));
    } else {
      this.writeLocal(items);
    }
  }

  async remove(productId: number): Promise<void> {
    this._items.set(this._items().filter(i => i.productId !== productId));
    if (this.auth.isLoggedIn()) {
      await firstValueFrom(this.http.delete(`${this.base}/items/${productId}`));
    } else {
      this.writeLocal(this._items());
    }
  }

  async setQuantity(productId: number, quantity: number): Promise<void> {
    await this.remove(productId);
    if (quantity > 0) {
      await this.add(productId, quantity);
    }
  }

  async clear(): Promise<void> {
    this._items.set([]);
    if (this.auth.isLoggedIn()) {
      await firstValueFrom(this.http.delete(this.base));
    } else {
      localStorage.removeItem(CART_KEY);
    }
  }

  // Called right after a successful login: merge the guest cart server-side.
  async flushAfterLogin(): Promise<void> {
    if (this.auth.isAdmin()) {
      localStorage.removeItem(CART_KEY);
      this._items.set([]);
      return;
    }
    const guest = this.readLocal();
    if (guest.length) {
      await firstValueFrom(this.http.post(`${this.base}/flush`, { items: guest }));
      localStorage.removeItem(CART_KEY);
    }
    await this.load();
  }

  private readLocal(): CartItem[] {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private writeLocal(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}
