import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface StockIssue {
  productId: number;
  requested: number;
  available: number;
  name?: string;
}

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Not enough stock</h2>
    <mat-dialog-content>
      <ul>
        @for (issue of data; track issue.productId) {
          <li>
            {{ issue.name ?? ('#' + issue.productId) }}:
            you wanted {{ issue.requested }}, only {{ issue.available }} left
          </li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(undefined)">Cancel</button>
      <button mat-raised-button color="primary" (click)="ref.close('adjust')">
        Adjust to available &amp; continue
      </button>
    </mat-dialog-actions>
  `,
})
export class StockDialogComponent {
  data = inject<StockIssue[]>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<StockDialogComponent>);
}
