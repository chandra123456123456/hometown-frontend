import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CustomOrderService, CustomOrder } from '../../core/custom-order.service';

@Component({
  selector: 'app-custom-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  templateUrl: './custom-order.component.html',
  styleUrl: './custom-order.component.scss',
})
export class CustomOrderComponent implements OnInit {
  private svc = inject(CustomOrderService);
  private snackBar = inject(MatSnackBar);

  type = signal('PAINTING');
  description = signal('');
  customerName = signal('');
  customerPhone = signal('');
  submitting = signal(false);

  requests = signal<CustomOrder[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadMine();
  }

  private loadMine(): void {
    this.loading.set(true);
    this.svc.mine().subscribe({
      next: list => {
        this.requests.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    if (!this.type() || !this.description() || !this.customerName() || !this.customerPhone()) return;
    this.submitting.set(true);
    this.svc.create({
      type: this.type(),
      description: this.description(),
      customerName: this.customerName(),
      customerPhone: this.customerPhone(),
    }).subscribe({
      next: () => {
        this.snackBar.open('Your custom order request has been submitted!', 'OK', { duration: 4000 });
        this.type.set('PAINTING');
        this.description.set('');
        this.customerName.set('');
        this.customerPhone.set('');
        this.submitting.set(false);
        this.loadMine();
      },
      error: () => {
        this.snackBar.open('Failed to submit request. Please try again.', 'Dismiss', { duration: 4000 });
        this.submitting.set(false);
      },
    });
  }

  priceDisplay(order: CustomOrder): string {
    return order.quotedPrice != null ? `₹${order.quotedPrice}` : 'pending';
  }

  deliveryDisplay(order: CustomOrder): string {
    return order.deliveryDate ?? 'to be confirmed';
  }

  statusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }
}
