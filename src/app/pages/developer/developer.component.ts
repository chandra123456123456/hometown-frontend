import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuditService, RequestLog } from '../../core/audit.service';

@Component({
  selector: 'app-developer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './developer.component.html',
  styleUrl: './developer.component.scss',
})
export class DeveloperComponent implements OnInit {
  private auditSvc = inject(AuditService);

  logs = signal<RequestLog[]>([]);
  loading = signal(true);
  error = signal('');

  filterPath = '';
  filterStatus: number | null = null;

  readonly columns = ['time', 'method', 'path', 'status', 'user', 'role', 'latency'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const opts: { path?: string; status?: number; limit: number } = { limit: 200 };
    if (this.filterPath.trim()) opts.path = this.filterPath.trim();
    if (this.filterStatus != null) opts.status = this.filterStatus;
    this.auditSvc.requests(opts).subscribe({
      next: data => { this.logs.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load audit log.'); this.loading.set(false); },
    });
  }

  statusClass(code: number): string {
    if (code >= 500) return 'status-5xx';
    if (code >= 400) return 'status-4xx';
    if (code >= 300) return 'status-3xx';
    return 'status-2xx';
  }
}
