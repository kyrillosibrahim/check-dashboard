import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

interface CurrentEntry {
  username: string;
  path: string;
  title: string;
  enteredAt: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityTrackerService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private titleService = inject(Title);
  private authService = inject(AuthService);

  private current: CurrentEntry | null = null;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => this.onNavigation((e as NavigationEnd).urlAfterRedirects));

    window.addEventListener('beforeunload', () => this.flushOnUnload());
  }

  private onNavigation(url: string): void {
    if (url.startsWith('/login')) {
      this.commitCurrent();
      this.current = null;
      return;
    }

    const username = this.authService.getCurrentUser();
    if (!username) {
      this.current = null;
      return;
    }

    this.commitCurrent();

    setTimeout(() => {
      this.current = {
        username,
        path: url,
        title: this.cleanTitle(this.titleService.getTitle()),
        enteredAt: Date.now(),
      };
    }, 0);
  }

  private commitCurrent(): void {
    if (!this.current) return;
    const entry = this.current;
    const durationSeconds = Math.floor((Date.now() - entry.enteredAt) / 1000);

    this.http
      .post(`${environment.baseUrl}/api/activity-logs`, {
        username: entry.username,
        path: entry.path,
        title: entry.title,
        enteredAt: new Date(entry.enteredAt).toISOString(),
        durationSeconds,
      })
      .subscribe({ error: () => {} });

    this.current = null;
  }

  private flushOnUnload(): void {
    if (!this.current) return;
    const entry = this.current;
    const durationSeconds = Math.floor((Date.now() - entry.enteredAt) / 1000);
    const body = JSON.stringify({
      username: entry.username,
      path: entry.path,
      title: entry.title,
      enteredAt: new Date(entry.enteredAt).toISOString(),
      durationSeconds,
    });

    try {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(`${environment.baseUrl}/api/activity-logs`, blob);
    } catch {
      // best-effort; ignore failures during unload
    }
    this.current = null;
  }

  private cleanTitle(raw: string): string {
    return raw.replace(/^KaroKan\s*-\s*/i, '').trim();
  }
}
