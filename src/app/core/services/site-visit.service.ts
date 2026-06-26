import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface ISiteVisit {
  _id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  date: string;
  visitCount: number;
  lastVisitAt: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SiteVisitService {
  private http = inject(HttpClient);

  getVisits(from?: string, to?: string, limit = 200): Observable<ISiteVisit[]> {
    let url = `${API_CONFIG.siteVisitsUrl}?limit=${limit}`;
    if (from) url += `&from=${from}`;
    if (to)   url += `&to=${to}`;
    return this.http.get<ISiteVisit[]>(url);
  }

  deleteAll(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(API_CONFIG.siteVisitsUrl);
  }
}
