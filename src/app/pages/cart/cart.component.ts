import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { CartService } from '../../core/cart.service';
import { ProductService } from '../../core/product.service';
import { Product } from '../../core/models';
import { encodeId } from '../../core/id-codec';
import { ProtectImageDirective } from '../../core/protect-image.directive';

interface CartLineView {
  productId: number;
  quantity: number;
  product: Product;
  lineTotal: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    ProtectImageDirective,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  cartSvc = inject(CartService);
  private productSvc = inject(ProductService);

  lines = signal<CartLineView[]>([]);
  subtotal = signal(0);
  loading = signal(true);

  readonly encodeId = encodeId;

  ngOnInit(): void {
    this.cartSvc.load().then(() => this.buildLines());
  }

  private buildLines(): void {
    const items = this.cartSvc.items();
    if (!items.length) {
      this.lines.set([]);
      this.subtotal.set(0);
      this.loading.set(false);
      return;
    }
    forkJoin(items.map(i => this.productSvc.get(i.productId))).subscribe({
      next: products => {
        const built: CartLineView[] = items.map((item, idx) => ({
          productId: item.productId,
          quantity: item.quantity,
          product: products[idx],
          lineTotal: products[idx].effectivePrice * item.quantity,
        }));
        this.lines.set(built);
        this.subtotal.set(built.reduce((s, l) => s + l.lineTotal, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  async increase(productId: number): Promise<void> {
    await this.cartSvc.add(productId, 1);
    this.refreshLine(productId, 1);
  }

  async decrease(productId: number): Promise<void> {
    const line = this.lines().find(l => l.productId === productId);
    if (!line) return;
    if (line.quantity <= 1) {
      await this.remove(productId);
    } else {
      await this.cartSvc.remove(productId);
      await this.cartSvc.add(productId, line.quantity - 1);
      this.refreshLine(productId, -1);
    }
  }

  async remove(productId: number): Promise<void> {
    await this.cartSvc.remove(productId);
    const updated = this.lines().filter(l => l.productId !== productId);
    this.lines.set(updated);
    this.subtotal.set(updated.reduce((s, l) => s + l.lineTotal, 0));
  }

  private refreshLine(productId: number, delta: number): void {
    const updated = this.lines().map(l => {
      if (l.productId !== productId) return l;
      const newQty = l.quantity + delta;
      return { ...l, quantity: newQty, lineTotal: l.product.effectivePrice * newQty };
    });
    this.lines.set(updated);
    this.subtotal.set(updated.reduce((s, l) => s + l.lineTotal, 0));
  }

  imageUrl(product: Product): string {
    return product.imageUrls?.[0] ?? `https://picsum.photos/seed/p${product.id}/80/80`;
  }
}
