import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'kaf-auth-session';
const MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours hard cap for any session

interface AdminAccount {
  username: string;
  password: string;
  alertOnLogin: boolean;
  persistent: boolean; // false → sessionStorage (dies with tab)
}

const ADMINS: ReadonlyArray<AdminAccount> = [
  { username: 'admin', password: '012011010', alertOnLogin: false, persistent: true  },
  { username: 'koko',  password: '012011010', alertOnLogin: true,  persistent: false },
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

    const payload: SessionPayload = { username: admin.username, ts: Date.now() };
    const encoded = btoa(JSON.stringify(payload));
    const store = admin.persistent ? localStorage : sessionStorage;
    store.setItem(STORAGE_KEY, encoded);

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
    return this.readSession() !== null;
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
      if (Date.now() - parsed.ts > MAX_SESSION_MS) return null;
      return { username: parsed.username, ts: parsed.ts };
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }
}
