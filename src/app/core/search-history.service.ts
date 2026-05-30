import { Injectable } from '@angular/core';

const STORAGE_KEY = 'ht_search_history';
const MAX_ENTRIES = 10;

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  record(term: string): void {
    const t = term.trim();
    if (!t) return;
    const current = this.recent().filter(e => e !== t);
    current.unshift(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ENTRIES)));
  }

  recent(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
}
