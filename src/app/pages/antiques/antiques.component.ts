import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { AuthService } from '../../core/auth.service';
import { Product } from '../../core/models';
import { encodeId } from '../../core/id-codec';
import { ProtectImageDirective } from '../../core/protect-image.directive';
import { StarRatingComponent } from '../../core/star-rating.component';

@Component({
  selector: 'app-antiques',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule,
    ProtectImageDirective, StarRatingComponent,
  ],
  templateUrl: './antiques.component.html',
  styleUrl: './antiques.component.scss',
})
export class AntiquesComponent implements OnInit {
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  auth = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal(false);

  readonly encodeId = encodeId;

  ngOnInit(): void {
    this.loading.set(true);
    this.productSvc.list({ antique: true, size: 50 }).subscribe({
      next: page => {
        this.products.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    this.cartSvc.add(product.id);
  }

  imageUrl(product: Product): string {
    return product.imageUrls?.[0] ?? `https://picsum.photos/seed/p${product.id}/400/300`;
  }
}
