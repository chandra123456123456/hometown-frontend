import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrderService } from '../../core/order.service';
import { Order } from '../../core/models';

const STATUSES = ['CREATED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private snackBar = inject(MatSnackBar);

  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  readonly statuses = STATUSES;

  ngOnInit(): void {
    this.orderSvc.listAll().subscribe({
      next: list => {
        this.orders.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load orders.');
        this.loading.set(false);
      },
    });
  }

  onStatusChange(order: Order, newStatus: string): void {
    this.orderSvc.updateStatus(order.id, newStatus).subscribe({
      next: updated => {
        this.orders.update(list =>
          list.map(o => (o.id === updated.id ? { ...o, status: updated.status } : o))
        );
        this.snackBar.open(`Order #${order.id} status updated to ${newStatus}.`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to update status. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  statusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}
