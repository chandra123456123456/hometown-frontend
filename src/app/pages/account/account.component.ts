import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../core/auth.service';
import { OrderService } from '../../core/order.service';
import { Order } from '../../core/models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private auth = inject(AuthService);
  private orderSvc = inject(OrderService);

  user = this.auth.user;
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.orderSvc.list().subscribe({
      next: list => {
        this.orders.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load orders. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      PLACED: 'accent',
      PROCESSING: 'primary',
      SHIPPED: 'primary',
      DELIVERED: '',
      CANCELLED: 'warn',
    };
    return map[status] ?? '';
  }

  statusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}
