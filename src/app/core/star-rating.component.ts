import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="stars">
      @for (s of stars; track $index) {
        <mat-icon class="star">{{ s }}</mat-icon>
      }
      @if (count != null) {
        <span class="count">({{ count }})</span>
      }
    </span>
  `,
  styles: [`
    .stars { display: inline-flex; align-items: center; gap: 1px; }
    mat-icon.star { font-size: 18px; height: 18px; width: 18px; color: #f9a825; }
    .count { font-size: 0.8rem; color: #757575; margin-left: 4px; }
  `],
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() count?: number;

  get stars(): string[] {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i + 1;
      if (this.rating >= filled) return 'star';
      if (this.rating >= filled - 0.5) return 'star_half';
      return 'star_border';
    });
  }
}
