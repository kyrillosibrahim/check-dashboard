import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IExpense } from '../models/expense.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);

  getAll(): Observable<IExpense[]> {
    return this.http.get<IExpense[]>(API_CONFIG.expensesUrl);
  }

  create(data: Partial<IExpense>): Observable<IExpense> {
    return this.http.post<IExpense>(API_CONFIG.expensesUrl, data);
  }

  update(id: number, data: Partial<IExpense>): Observable<IExpense> {
    return this.http.put<IExpense>(`${API_CONFIG.expensesUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.expensesUrl}/${id}`);
  }
}
