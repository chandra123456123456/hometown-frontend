import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { AnalyticsService } from '../../core/analytics.service';
import { Category, Product } from '../../core/models';
import { encodeId } from '../../core/id-codec';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatPaginatorModule, MatProgressSpinnerModule,
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private analytics = inject(AnalyticsService);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  totalElements = signal(0);
  loading = signal(false);

  searchQuery = '';
  selectedCategoryId: number | null = null;
  pageIndex = 0;
  pageSize = 12;

  readonly encodeId = encodeId;

  ngOnInit(): void {
    this.analytics.track('CATALOG_VIEW');
    this.productSvc.categories().subscribe(cats => this.categories.set(cats));
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productSvc.list({
      categoryId: this.selectedCategoryId ?? undefined,
      q: this.searchQuery || undefined,
      page: this.pageIndex,
      size: this.pageSize,
    }).subscribe({
      next: page => {
        this.products.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.pageIndex = 0;
    this.loadProducts();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  addToCart(productId: number): void {
    this.cartSvc.add(productId);
  }

  imageUrl(product: Product): string {
    return product.imageUrls?.[0] ?? `https://picsum.photos/seed/p${product.id}/400/300`;
  }
}
