import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../../core/product.service';
import { Category, Product } from '../../core/models';

interface ProductForm {
  name: string;
  description: string;
  price: number | null;
  discountPercent: number | null;
  categoryId: number | null;
  stock: number | null;
  active: boolean;
  antique: boolean;
  imageUrlsRaw: string;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  artType: string;
  artWidthCm: number | null;
  artHeightCm: number | null;
}

function emptyForm(): ProductForm {
  return {
    name: '',
    description: '',
    price: null,
    discountPercent: 0,
    categoryId: null,
    stock: 0,
    active: true,
    antique: false,
    imageUrlsRaw: '',
    weightGrams: null,
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    artType: 'NONE',
    artWidthCm: null,
    artHeightCm: null,
  };
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private productSvc = inject(ProductService);
  private snackBar = inject(MatSnackBar);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);

  displayedColumns = ['name', 'category', 'price', 'discount', 'stock', 'active', 'actions'];

  editingId: number | null = null;
  formPanelOpen = false;
  form: ProductForm = emptyForm();
  uploading = signal(false);
  uploadPreviews: string[] = [];
  selectedFile: File | null = null;

  newCatName = '';
  newCatSlug = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.productSvc.categories().subscribe(cats => this.categories.set(cats));
    this.productSvc.list({ size: 100 }).subscribe({
      next: page => {
        this.products.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  categoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '—';
  }

  startEdit(product: Product): void {
    this.editingId = product.id;
    this.form = {
      name: product.name,
      description: product.description,
      price: product.price,
      discountPercent: product.discountPercent,
      categoryId: product.categoryId,
      stock: product.stock,
      active: product.active,
      antique: product.antique ?? false,
      imageUrlsRaw: product.imageUrls?.join(', ') ?? '',
      weightGrams: null,
      lengthCm: null,
      widthCm: null,
      heightCm: null,
      artType: product.artType ?? 'NONE',
      artWidthCm: product.artWidthCm ?? null,
      artHeightCm: product.artHeightCm ?? null,
    };
    this.formPanelOpen = true;
  }

  resetForm(): void {
    this.editingId = null;
    this.form = emptyForm();
    this.formPanelOpen = false;
    this.uploadPreviews = [];
    this.selectedFile = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadImage(): void {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.productSvc.uploadImage(this.selectedFile).subscribe({
      next: res => {
        this.uploading.set(false);
        this.uploadPreviews.push(res.previewUrl);
        const existing = this.form.imageUrlsRaw.trim();
        this.form.imageUrlsRaw = existing ? `${existing}, ${res.url}` : res.url;
        this.selectedFile = null;
        this.snackBar.open('Image uploaded.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.uploading.set(false);
        this.snackBar.open('Image upload failed.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  submitForm(): void {
    if (!this.form.name || this.form.price == null) {
      this.snackBar.open('Name and price are required.', 'Dismiss', { duration: 3000 });
      return;
    }

    const imageUrls = this.form.imageUrlsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const body: any = {
      name: this.form.name,
      description: this.form.description,
      price: this.form.price!,
      discountPercent: this.form.discountPercent ?? 0,
      categoryId: this.form.categoryId!,
      stock: this.form.stock ?? 0,
      active: this.form.active,
      antique: this.form.antique,
      imageUrls,
    };
    if (this.form.weightGrams != null) body['weightGrams'] = this.form.weightGrams;
    if (this.form.lengthCm != null) body['lengthCm'] = this.form.lengthCm;
    if (this.form.widthCm != null) body['widthCm'] = this.form.widthCm;
    if (this.form.heightCm != null) body['heightCm'] = this.form.heightCm;
    body['artType'] = this.form.artType;
    if (this.form.artWidthCm != null) body['artWidthCm'] = this.form.artWidthCm;
    if (this.form.artHeightCm != null) body['artHeightCm'] = this.form.artHeightCm;

    const op = this.editingId != null
      ? this.productSvc.update(this.editingId, body)
      : this.productSvc.create(body);

    op.subscribe({
      next: () => {
        const msg = this.editingId != null ? 'Product updated.' : 'Product created.';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.resetForm();
        this.loadAll();
      },
      error: () => {
        this.snackBar.open('Operation failed. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  deleteProduct(id: number, name: string): void {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    this.productSvc.remove(id).subscribe({
      next: () => {
        this.snackBar.open('Product deleted.', 'OK', { duration: 3000 });
        this.loadAll();
      },
      error: () => {
        this.snackBar.open('Delete failed. Please try again.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  addCategory(): void {
    const name = this.newCatName.trim();
    const slug = this.newCatSlug.trim();
    if (!name || !slug) {
      this.snackBar.open('Category name and slug are required.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.productSvc.createCategory(name, slug).subscribe({
      next: () => {
        this.snackBar.open('Category added.', 'OK', { duration: 3000 });
        this.newCatName = '';
        this.newCatSlug = '';
        this.productSvc.categories().subscribe(cats => this.categories.set(cats));
      },
      error: () => {
        this.snackBar.open('Failed to add category.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
