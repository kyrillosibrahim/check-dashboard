import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IMerchant } from '../models/merchant.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private http = inject(HttpClient);

  getAll(): Observable<IMerchant[]> {
    return this.http.get<IMerchant[]>(API_CONFIG.merchantsUrl);
  }

  getById(id: number): Observable<IMerchant> {
    return this.http.get<IMerchant>(`${API_CONFIG.merchantsUrl}/${id}`);
  }

  create(data: Partial<IMerchant>): Observable<IMerchant> {
    return this.http.post<IMerchant>(API_CONFIG.merchantsUrl, data);
  }

  update(id: number, data: Partial<IMerchant>): Observable<IMerchant> {
    return this.http.put<IMerchant>(`${API_CONFIG.merchantsUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.merchantsUrl}/${id}`);
  }
}
