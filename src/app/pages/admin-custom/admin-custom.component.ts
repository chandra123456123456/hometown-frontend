import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CustomOrderService, CustomOrder } from '../../core/custom-order.service';

const STATUSES = ['REQUESTED', 'IN_DISCUSSION', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

interface EditState {
  description: string;
  status: string;
  quotedPrice: number | null;
  deliveryDate: string;
  adminNotes: string;
}

@Component({
  selector: 'app-admin-custom',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
  templateUrl: './admin-custom.component.html',
  styleUrl: './admin-custom.component.scss',
})
export class AdminCustomComponent implements OnInit {
  private svc = inject(CustomOrderService);
  private snackBar = inject(MatSnackBar);

  orders = signal<CustomOrder[]>([]);
  loading = signal(true);
  error = signal('');
  saving = signal<Set<number>>(new Set());
  readonly statuses = STATUSES;

  edits = new Map<number, EditState>();

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.adminAll().subscribe({
      next: list => {
        this.orders.set(list);
        this.edits.clear();
        for (const o of list) {
          this.edits.set(o.id, {
            description: o.description,
            status: o.status,
            quotedPrice: o.quotedPrice,
            deliveryDate: o.deliveryDate ?? '',
            adminNotes: o.adminNotes ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load custom orders.');
        this.loading.set(false);
      },
    });
  }

  getEdit(id: number): EditState {
    return this.edits.get(id)!;
  }

  save(order: CustomOrder): void {
    const e = this.edits.get(order.id);
    if (!e) return;
    const s = new Set(this.saving());
    s.add(order.id);
    this.saving.set(s);

    this.svc.adminUpdate({
      id: order.id,
      description: e.description,
      status: e.status,
      quotedPrice: e.quotedPrice ?? undefined,
      deliveryDate: e.deliveryDate || undefined,
      adminNotes: e.adminNotes || undefined,
    }).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.edits.set(updated.id, {
          description: updated.description,
          status: updated.status,
          quotedPrice: updated.quotedPrice,
          deliveryDate: updated.deliveryDate ?? '',
          adminNotes: updated.adminNotes ?? '',
        });
        const s2 = new Set(this.saving());
        s2.delete(order.id);
        this.saving.set(s2);
        this.snackBar.open(`Order #${order.id} updated.`, 'OK', { duration: 3000 });
      },
      error: () => {
        const s2 = new Set(this.saving());
        s2.delete(order.id);
        this.saving.set(s2);
        this.snackBar.open('Failed to update. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  isSaving(id: number): boolean {
    return this.saving().has(id);
  }

  statusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }
}
