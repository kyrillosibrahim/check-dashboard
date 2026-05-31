import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class KeepAliveService implements OnDestroy {
  private http = inject(HttpClient);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  start(): void {
    if (this.intervalId) return;
    this.ping();
    this.intervalId = setInterval(() => this.ping(), this.INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private ping(): void {
    this.http.get(`${API_CONFIG.baseUrl}/api/health`, { responseType: 'json' })
      .subscribe({ error: () => {} });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
