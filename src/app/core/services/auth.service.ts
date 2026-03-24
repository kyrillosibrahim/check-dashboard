import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const STORAGE_KEY = 'karokan-auth-session';
const VALID_PHONE = '01275388239';
const VALID_PASSWORD = '147147';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = signal<boolean>(false);
  readonly isLoggedIn = this._isLoggedIn.asReadonly();

  constructor(private router: Router) {
    this._isLoggedIn.set(this.checkSession());
  }

  login(phone: string, password: string): boolean {
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    if (cleanPhone === VALID_PHONE && cleanPassword === VALID_PASSWORD) {
      const sessionData = btoa(JSON.stringify({ authenticated: true, ts: Date.now() }));
      localStorage.setItem(STORAGE_KEY, sessionData);
      this._isLoggedIn.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  checkSession(): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(atob(data));
      return parsed?.authenticated === true;
    } catch {
      return false;
    }
  }
}
