import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { AnalyticsService } from '../../core/analytics.service';
import { OrderService } from '../../core/order.service';
import { AuthService } from '../../core/auth.service';
import { Product, Review, ShippingOption } from '../../core/models';
import { decodeId } from '../../core/id-codec';
import { ProtectImageDirective } from '../../core/protect-image.directive';
import { StarRatingComponent } from '../../core/star-rating.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatSelectModule, MatChipsModule,
    ProtectImageDirective, StarRatingComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private analytics = inject(AnalyticsService);
  private orderSvc = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  product = signal<Product | null>(null);
  loading = signal(true);
  notFound = signal(false);
  reviews = signal<Review[]>([]);

  quantity = 1;
  pincode = '';
  shippingResult = signal<ShippingOption | null>(null);
  shippingNotServiceable = signal(false);
  shippingLoading = signal(false);

  newRating = 5;
  newComment = '';
  submitting = signal(false);

  readonly ratingOptions = [1, 2, 3, 4, 5];

  private productId = 0;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    const id = decodeId(code);
    if (isNaN(id)) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.productId = id;
    this.loadProduct();
    this.loadReviews();
  }

  private loadProduct(): void {
    this.productSvc.get(this.productId).subscribe({
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

  private loadReviews(): void {
    this.productSvc.getReviews(this.productId).subscribe({
      next: r => this.reviews.set(r),
      error: () => {},
    });
  }

  submitReview(): void {
    if (!this.newComment.trim()) return;
    this.submitting.set(true);
    this.productSvc.addReview(this.productId, this.newRating, this.newComment.trim()).subscribe({
      next: () => {
        this.snackBar.open('Review submitted!', 'OK', { duration: 3000 });
        this.newRating = 5;
        this.newComment = '';
        this.submitting.set(false);
        this.loadReviews();
        this.loadProduct();
      },
      error: () => {
        this.snackBar.open('Failed to submit review.', 'OK', { duration: 3000 });
        this.submitting.set(false);
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
    const pin = this.pincode.trim();
    if (!pin || !this.product()) return;
    this.shippingLoading.set(true);
    this.shippingResult.set(null);
    this.shippingNotServiceable.set(false);
    this.orderSvc.shippingQuote([{ productId: this.product()!.id, quantity: 1 }], pin).subscribe({
      next: opts => {
        this.shippingLoading.set(false);
        const serviceable = opts.filter(o => o.serviceable);
        if (serviceable.length) {
          const best = serviceable.reduce((a, b) => a.charge <= b.charge ? a : b);
          this.shippingResult.set(best);
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

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported by your browser.', 'Close', { duration: 3000 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
          .then(r => r.json())
          .then((data: any) => {
            const postcode: string = data?.address?.postcode ?? '';
            const pin = postcode.replace(/\D/g, '').slice(0, 6);
            if (pin.length === 6) {
              this.pincode = pin;
              this.checkDelivery();
            } else {
              this.snackBar.open('Could not determine pincode from your location.', 'Close', { duration: 3000 });
            }
          })
          .catch(() => this.snackBar.open('Reverse geocoding failed. Please enter pincode manually.', 'Close', { duration: 3000 }));
      },
      () => this.snackBar.open('Location access denied. Please enter pincode manually.', 'Close', { duration: 3000 }),
    );
  }

  imageUrl(product: Product): string {
    return product.imageUrls?.[0] ?? `https://picsum.photos/seed/p${product.id}/400/300`;
  }
}
