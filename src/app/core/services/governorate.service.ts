import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IGovernorate } from '../models/governorate.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class GovernorateService {
  private http = inject(HttpClient);

  getAll(): Observable<IGovernorate[]> {
    return this.http.get<IGovernorate[]>(API_CONFIG.governoratesUrl);
  }

  updateShippingCost(id: number, shippingCost: number): Observable<IGovernorate> {
    return this.http.put<IGovernorate>(`${API_CONFIG.governoratesUrl}/${id}`, { shippingCost });
  }
}
