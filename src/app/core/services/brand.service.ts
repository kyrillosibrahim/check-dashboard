import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBrand } from '../models/brand.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);

  getAll(): Observable<IBrand[]> {
    return this.http.get<IBrand[]>(API_CONFIG.brandsUrl);
  }

  create(formData: FormData): Observable<IBrand> {
    return this.http.post<IBrand>(API_CONFIG.brandsUrl, formData);
  }

  update(id: number, formData: FormData): Observable<IBrand> {
    return this.http.put<IBrand>(`${API_CONFIG.brandsUrl}/${id}`, formData);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.brandsUrl}/${id}`);
  }
}
