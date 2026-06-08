import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProductReview } from '../models/product-review.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ProductReviewService {
  private http = inject(HttpClient);

  getAll(): Observable<IProductReview[]> {
    return this.http.get<IProductReview[]>(API_CONFIG.reviewsUrl);
  }

  approve(id: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API_CONFIG.reviewsUrl}/${id}/approve`, {});
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.reviewsUrl}/${id}`);
  }

  disableUser(userId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API_CONFIG.reviewsUrl}/disable-user/${userId}`, {});
  }
}
