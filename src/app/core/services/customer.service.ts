import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICustomer } from '../models/customer.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);

  getAll(): Observable<ICustomer[]> {
    return this.http.get<ICustomer[]>(`${API_CONFIG.authUrl}/users`);
  }

  update(id: string, data: Partial<ICustomer>): Observable<ICustomer> {
    return this.http.put<ICustomer>(`${API_CONFIG.authUrl}/users/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.authUrl}/users/${id}`);
  }
}
