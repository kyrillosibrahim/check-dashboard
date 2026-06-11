import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface SendNotificationPayload {
  type: 'general' | 'coupon';
  title: string;
  body: string;
  link?: string;
  coupon?: { code: string; discountPercentage: number };
  target: 'all' | { orderStatus: string } | { userIds: string[] };
}

export interface SentCampaign {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  coupon?: { code: string; discountPercentage: number; expiresAt: string };
  audience: string;
  recipientsCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  send(payload: SendNotificationPayload): Observable<{ message: string; sent: number; audience: string }> {
    return this.http.post<{ message: string; sent: number; audience: string }>(
      `${API_CONFIG.notificationsUrl}/admin/send`,
      payload
    );
  }

  getSent(): Observable<SentCampaign[]> {
    return this.http.get<SentCampaign[]>(`${API_CONFIG.notificationsUrl}/admin/sent`);
  }
}
