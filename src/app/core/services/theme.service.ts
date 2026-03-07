import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'sz-theme';
  private themeSubject = new BehaviorSubject<Theme>(this.loadTheme());

  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.getValue());
  }

  toggleTheme(): void {
    const next: Theme = this.themeSubject.getValue() === 'light' ? 'dark' : 'light';
    this.themeSubject.next(next);
    this.applyTheme(next);
    localStorage.setItem(this.STORAGE_KEY, next);
  }

  isDark(): boolean {
    return this.themeSubject.getValue() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  private loadTheme(): Theme {
    return (localStorage.getItem(this.STORAGE_KEY) as Theme) || 'light';
  }
}
