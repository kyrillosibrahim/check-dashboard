import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IOrder } from '../models/order.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  getAll(): Observable<IOrder[]> {
    return this.http.get<IOrder[]>(API_CONFIG.ordersUrl);
  }

  getById(id: string): Observable<IOrder> {
    return this.http.get<IOrder>(`${API_CONFIG.ordersUrl}/${id}`);
  }

  create(data: Partial<IOrder>): Observable<{ message: string; order: IOrder }> {
    return this.http.post<{ message: string; order: IOrder }>(API_CONFIG.ordersUrl, data);
  }

  update(id: string, data: Partial<IOrder>): Observable<{ message: string; order: IOrder }> {
    return this.http.put<{ message: string; order: IOrder }>(`${API_CONFIG.ordersUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.ordersUrl}/${id}`);
  }
}
