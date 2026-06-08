import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';

/**
 * Tracks "needs attention" counts for the sidebar badges:
 * - pending product reviews (status === 'pending')
 * - new orders (status === 'pending')
 */
@Injectable({ providedIn: 'root' })
export class BadgeService {
  private http = inject(HttpClient);

  pendingReviews = signal(0);
  pendingOrders = signal(0);

  refresh(): void {
    this.http.get<any[]>(API_CONFIG.reviewsUrl).subscribe({
      next: (list) => this.pendingReviews.set((list || []).filter(r => r?.status !== 'approved').length),
      error: () => { /* ignore */ },
    });
    this.http.get<any[]>(API_CONFIG.ordersUrl).subscribe({
      next: (list) => this.pendingOrders.set((list || []).filter(o => o?.status === 'pending').length),
      error: () => { /* ignore */ },
    });
  }
}
