import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AnalyticsService } from '../../core/analytics.service';
import { ProductService } from '../../core/product.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TopProductRow {
  productId: number;
  name: string;
  views: number;
}

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './metrics.component.html',
  styleUrl: './metrics.component.scss',
})
export class MetricsComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  private productSvc = inject(ProductService);

  sellerId = 1;

  summary = signal<any>(null);
  topRows = signal<TopProductRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  readonly displayedColumns = ['product', 'views'];

  readonly metricCards = [
    { label: 'Total Visits',     field: 'totalVisits' },
    { label: 'Product Views',    field: 'productViews' },
    { label: 'Add-to-Cart',      field: 'addToCarts' },
    { label: 'Checkouts',        field: 'checkouts' },
    { label: 'Unique Sessions',  field: 'uniqueSessions' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      summary: this.analytics.sellerSummary(this.sellerId).pipe(
        catchError(() => of(null))
      ),
      top: this.analytics.topProducts(10).pipe(
        catchError(() => of([] as { productId: number; views: number }[]))
      ),
    }).subscribe(({ summary, top }) => {
      this.summary.set(summary ?? {});

      const safeTop: { productId: number; views: number }[] = top ?? [];
      if (safeTop.length === 0) {
        this.topRows.set([]);
        this.loading.set(false);
        return;
      }

      const productRequests = safeTop.reduce((acc, row) => {
        acc[row.productId] = this.productSvc.get(row.productId).pipe(
          catchError(() => of(null))
        );
        return acc;
      }, {} as Record<number, any>);

      forkJoin(productRequests).subscribe((productMap: Record<number, any>) => {
        const rows: TopProductRow[] = safeTop.map(row => ({
          productId: row.productId,
          name: productMap[row.productId]?.name ?? `Product ${row.productId}`,
          views: row.views,
        }));
        this.topRows.set(rows);
        this.loading.set(false);
      });
    });
  }

  metricValue(field: string): number {
    const s = this.summary();
    if (!s) return 0;
    const val = s[field];
    return typeof val === 'number' ? val : 0;
  }
}
