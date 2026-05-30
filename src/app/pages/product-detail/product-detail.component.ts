import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { AnalyticsService } from '../../core/analytics.service';
import { ShippingService } from '../../core/shipping.service';
import { Product, ShippingOption } from '../../core/models';
import { decodeId } from '../../core/id-codec';
import { ProtectImageDirective } from '../../core/protect-image.directive';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    ProtectImageDirective,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private analytics = inject(AnalyticsService);
  private shippingSvc = inject(ShippingService);

  product = signal<Product | null>(null);
  loading = signal(true);
  notFound = signal(false);

  quantity = 1;
  pincode = '';
  shippingResult = signal<ShippingOption | null>(null);
  shippingNotServiceable = signal(false);
  shippingLoading = signal(false);

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    const id = decodeId(code);
    if (isNaN(id)) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.productSvc.get(id).subscribe({
      next: p => {
        this.product.set(p);
        this.loading.set(false);
        this.analytics.track('PRODUCT_VIEW', {
          productId: p.id,
          sellerId: p.sellerId ?? undefined,
          category: undefined,
        });
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  addToCart(): void {
    const p = this.product();
    if (p) {
      this.cartSvc.add(p.id, this.quantity);
      this.analytics.track('ADD_TO_CART', { productId: p.id, sellerId: p.sellerId ?? undefined });
    }
  }

  checkDelivery(): void {
    if (!this.pincode.trim()) return;
    this.shippingLoading.set(true);
    this.shippingResult.set(null);
    this.shippingNotServiceable.set(false);
    this.shippingSvc.estimate(this.pincode.trim()).subscribe({
      next: opt => {
        this.shippingLoading.set(false);
        if (opt.serviceable) {
          this.shippingResult.set(opt);
        } else {
          this.shippingNotServiceable.set(true);
        }
      },
      error: () => {
        this.shippingLoading.set(false);
        this.shippingNotServiceable.set(true);
      },
    });
  }

  imageUrl(product: Product): string {
    return product.imageUrls?.[0] ?? `https://picsum.photos/seed/p${product.id}/400/300`;
  }
}
