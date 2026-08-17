import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface ICustomerActivity {
  _id: string;
  deviceId: string;
  deviceName: string;
  userId: string | null;
  userName: string;
  userPhone: string;
  path: string;
  title: string;
  enteredAt: string;
  durationSeconds: number;
  date: string;
}

export interface ICustomerActivitySummary {
  totalEvents: number;
  totalDurationSeconds: number;
  uniqueDevices: number;
  uniqueCustomers: number;
}

export interface ICustomerActivityPage {
  items: ICustomerActivity[];
  total: number;
  page: number;
  limit: number;
  summary: ICustomerActivitySummary;
}

export interface ICustomerFunnelStage {
  key: string;
  label: string;
  devices?: number;
  ips?: number;
  count?: number;
  unit: 'device' | 'order';
}

export interface ICustomerFunnel {
  range: {
    from: string | null;
    to: string | null;
  };
  minDwellSeconds: number;
  stages: ICustomerFunnelStage[];
  rawTraffic: {
    devices: number;
    ips: number;
    records: number;
  };
  abandonedCarts: {
    carts: number;
    items: number;
    guestCarts: number;
  };
  excluded: {
    botDevices: number;
    botHits: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CustomerActivityService {
  private http = inject(HttpClient);

  getActivity(opts: {
    from?: string;
    to?: string;
    q?: string;
    deviceId?: string;
    onlyRegistered?: boolean;
    page?: number;
    limit?: number;
  }): Observable<ICustomerActivityPage> {
    let params = new HttpParams();
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    if (opts.q) params = params.set('q', opts.q);
    if (opts.deviceId) params = params.set('deviceId', opts.deviceId);
    if (opts.onlyRegistered) params = params.set('onlyRegistered', 'true');
    if (opts.page !== undefined) params = params.set('page', opts.page);
    if (opts.limit !== undefined) params = params.set('limit', opts.limit);
    return this.http.get<ICustomerActivityPage>(API_CONFIG.customerActivityUrl, { params });
  }

  getFunnel(from?: string, to?: string): Observable<ICustomerFunnel> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ICustomerFunnel>(API_CONFIG.customerActivityFunnelUrl, { params });
  }

  deleteAll(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(API_CONFIG.customerActivityUrl);
  }
}
