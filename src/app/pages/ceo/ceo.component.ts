import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ceo',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './ceo.component.html',
  styleUrl: './ceo.component.scss',
})
export class CeoComponent {
  ceoName = 'Ananya Verma';
  ceoTitle = 'Founder & Chief Executive Officer';
  ceoEmail = 'ananya.verma@hometowncrafts.in';
  fallback = 'https://picsum.photos/seed/hometownceo/520/520';

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = this.fallback;
  }
}
