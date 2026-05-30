import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, firstValueFrom } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CartService } from '../../core/cart.service';
import { ProductService } from '../../core/product.service';
import { OrderService } from '../../core/order.service';
import { ShippingService } from '../../core/shipping.service';
import { AnalyticsService } from '../../core/analytics.service';
import { Product, ShippingOption } from '../../core/models';
import { environment } from '../../../environments/environment';
import { encodeId } from '../../core/id-codec';
import { StockDialogComponent, StockIssue } from './stock-dialog.component';

interface CheckoutLine {
  productId: number;
  quantity: number;
  product: Product;
  lineTotal: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private cartSvc = inject(CartService);
  private productSvc = inject(ProductService);
  private orderSvc = inject(OrderService);
  private shippingSvc = inject(ShippingService);
  private analytics = inject(AnalyticsService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  lines = signal<CheckoutLine[]>([]);
  subtotal = signal(0);
  loading = signal(true);

  shippingAddress = '';
  destPincode = '';

  shippingOptions = signal<ShippingOption[]>([]);
  selectedOption = signal<ShippingOption | null>(null);
  loadingShipping = signal(false);
  shippingError = signal('');

  placing = signal(false);

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
        const built: CheckoutLine[] = items.map((item, idx) => ({
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

  pincodeInvalid(): boolean {
    return !!this.destPincode && !/^\d{6}$/.test(this.destPincode);
  }

  onPincodeChange(): void {
    if (this.destPincode.length !== 6 || !/^\d{6}$/.test(this.destPincode)) {
      this.shippingOptions.set([]);
      this.selectedOption.set(null);
      this.shippingError.set('');
      return;
    }
    this.loadingShipping.set(true);
    this.shippingError.set('');
    this.shippingSvc.quotes(this.destPincode).subscribe({
      next: opts => {
        const serviceable = opts.filter(o => o.serviceable);
        this.shippingOptions.set(serviceable);
        this.selectedOption.set(serviceable.length ? serviceable[0] : null);
        if (!serviceable.length) {
          this.shippingError.set('No shipping available for this pincode.');
        }
        this.loadingShipping.set(false);
      },
      error: () => {
        this.shippingOptions.set([]);
        this.selectedOption.set(null);
        this.shippingError.set('Could not fetch shipping options. Please try again.');
        this.loadingShipping.set(false);
      },
    });
  }

  get grandTotal(): number {
    return this.subtotal() + (this.selectedOption()?.charge ?? 0);
  }

  get canPlace(): boolean {
    return (
      this.lines().length > 0 &&
      this.shippingAddress.trim().length > 0 &&
      /^\d{6}$/.test(this.destPincode) &&
      this.selectedOption() !== null &&
      !this.placing()
    );
  }

  async placeOrder(): Promise<void> {
    if (!this.canPlace) return;
    this.placing.set(true);

    try {
      const cartItems = this.cartSvc.items().map(i => ({ productId: i.productId, quantity: i.quantity }));
      const res = await firstValueFrom(this.orderSvc.validateStock(cartItems));

      if (res.ok) {
        await this.doPlaceOrder();
        return;
      }

      // enrich issues with product names from loaded lines
      const issues: StockIssue[] = res.issues.map(issue => ({
        ...issue,
        name: this.lines().find(l => l.productId === issue.productId)?.product.name,
      }));

      this.placing.set(false);
      const result = await firstValueFrom(
        this.dialog.open(StockDialogComponent, { data: issues, width: '420px' }).afterClosed()
      );

      if (result !== 'adjust') return;

      this.placing.set(true);
      for (const issue of issues) {
        await this.cartSvc.setQuantity(issue.productId, issue.available);
      }
      this.buildLines();

      // re-validate once more for safety
      const cartItems2 = this.cartSvc.items().map(i => ({ productId: i.productId, quantity: i.quantity }));
      const res2 = await firstValueFrom(this.orderSvc.validateStock(cartItems2));
      if (!res2.ok) {
        this.placing.set(false);
        this.snackBar.open('Stock changed again. Please review your cart.', 'Close', { duration: 4000 });
        return;
      }

      await this.doPlaceOrder();
    } catch {
      this.placing.set(false);
      this.snackBar.open('Failed to place order. Please try again.', 'Close', { duration: 4000 });
    }
  }

  private async doPlaceOrder(): Promise<void> {
    const option = this.selectedOption()!;
    this.orderSvc.create({
      items: this.cartSvc.items().map(i => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: this.shippingAddress.trim(),
      destPincode: this.destPincode,
      shippingPartner: option.partner,
    }).subscribe({
      next: async order => {
        try {
          await this.http.post(`${environment.apiBase}/payments`, {
            orderId: order.id,
            amount: order.totalAmount,
          }).toPromise();
        } catch {
          // payment errors are non-fatal for UX flow
        }
        this.analytics.track('CHECKOUT');
        await this.cartSvc.clear();
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 4000 });
        this.router.navigate(['/account']);
      },
      error: () => {
        this.placing.set(false);
        this.snackBar.open('Failed to place order. Please try again.', 'Close', { duration: 4000 });
      },
    });
  }

  imageUrl(product: Product): string {
    return product.imageUrls?.[0] ?? `https://picsum.photos/seed/p${product.id}/60/60`;
  }
}
