import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'kaf-auth-session';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SESSION_REFRESH_AFTER_MS = HOUR_MS; // rewrite the timestamp at most once an hour

interface AdminAccount {
  username: string;
  password: string;
  alertOnLogin: boolean;
  persistent: boolean; // false → sessionStorage (dies with tab)
  maxSessionMs: number; // sliding expiry, refreshed on every visit
}

const ADMINS: ReadonlyArray<AdminAccount> = [
  { username: 'admin', password: '012011010', alertOnLogin: false, persistent: true,  maxSessionMs: 30 * DAY_MS },
  { username: 'koko',  password: '012011010', alertOnLogin: true,  persistent: false, maxSessionMs: 12 * HOUR_MS },
];

interface SessionPayload {
  username: string;
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);

  private _isLoggedIn = signal<boolean>(false);
  private _currentUser = signal<string | null>(null);

  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAdmin = computed(() => this._currentUser() === 'admin');

  constructor() {
    const session = this.readSession();
    if (session) {
      this._isLoggedIn.set(true);
      this._currentUser.set(session.username);
      this.touchSession(session);
    } else {
      this.clearSession();
    }
  }

  login(username: string, password: string): boolean {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    const admin = ADMINS.find(
      a => a.username === cleanUsername && a.password === cleanPassword
    );
    if (!admin) return false;

    this.clearSession();
    this.writeSession(admin, Date.now());

    this._isLoggedIn.set(true);
    this._currentUser.set(admin.username);

    if (admin.alertOnLogin) {
      this.http
        .post(`${environment.baseUrl}/api/notifications/login-alert`, {
          username: admin.username,
        })
        .subscribe({
          error: err => console.warn('[login-alert] failed:', err?.message ?? err),
        });
    }

    return true;
  }

  logout(): void {
    this.clearSession();
    this._isLoggedIn.set(false);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  checkSession(): boolean {
    const session = this.readSession();
    if (!session) return false;
    this.touchSession(session);
    return true;
  }

  getCurrentUser(): string | null {
    return this._currentUser();
  }

  private readSession(): SessionPayload | null {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(atob(raw)) as Partial<SessionPayload>;
      if (!parsed?.username || !parsed.ts) return null;
      const admin = ADMINS.find(a => a.username === parsed.username);
      if (!admin) return null;
      if (Date.now() - parsed.ts > admin.maxSessionMs) return null;
      return { username: parsed.username, ts: parsed.ts };
    } catch {
      return null;
    }
  }

  private writeSession(admin: AdminAccount, ts: number): void {
    const payload: SessionPayload = { username: admin.username, ts };
    const encoded = btoa(JSON.stringify(payload));
    const store = admin.persistent ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, encoded);
  }

  // Slides the expiry forward, so an account in regular use never has to log in again.
  private touchSession(session: SessionPayload): void {
    if (Date.now() - session.ts < SESSION_REFRESH_AFTER_MS) return;
    const admin = ADMINS.find(a => a.username === session.username);
    if (admin) this.writeSession(admin, Date.now());
  }

  private clearSession(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
}
