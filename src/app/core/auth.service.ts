import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from './models';

interface SessionUser {
  name: string;
  email: string;
  role: string;
}

const TOKEN_KEY = 'ht_access_token';
const REFRESH_KEY = 'ht_refresh_token';
const USER_KEY = 'ht_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/auth`;

  private _user = signal<SessionUser | null>(this.readUser());
  user = this._user.asReadonly();
  isLoggedIn = computed(() => this._user() !== null);
  isAdmin = computed(() => this._user()?.role === 'ADMIN');
  isDeveloper = computed(() => this._user()?.role === 'DEVELOPER');

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, { name, email, password })
      .pipe(tap(res => this.store(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password })
      .pipe(tap(res => this.store(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private store(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    const u: SessionUser = { name: res.name, email: res.email, role: res.role };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    this._user.set(u);
  }

  private readUser(): SessionUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
