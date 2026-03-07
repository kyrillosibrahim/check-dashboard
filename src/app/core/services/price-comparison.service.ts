import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPriceComparison } from '../models/price-comparison.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class PriceComparisonService {
  private http = inject(HttpClient);

  getAll(): Observable<IPriceComparison[]> {
    return this.http.get<IPriceComparison[]>(API_CONFIG.priceComparisonsUrl);
  }

  create(data: Partial<IPriceComparison>): Observable<IPriceComparison> {
    return this.http.post<IPriceComparison>(API_CONFIG.priceComparisonsUrl, data);
  }

  update(id: number, data: Partial<IPriceComparison>): Observable<IPriceComparison> {
    return this.http.put<IPriceComparison>(`${API_CONFIG.priceComparisonsUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.priceComparisonsUrl}/${id}`);
  }
}
