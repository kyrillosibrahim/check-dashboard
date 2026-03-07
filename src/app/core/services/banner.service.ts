import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBanner } from '../models/banner.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private http = inject(HttpClient);

  getAll(): Observable<IBanner[]> {
    return this.http.get<IBanner[]>(API_CONFIG.bannersUrl);
  }

  create(fd: FormData): Observable<IBanner> {
    return this.http.post<IBanner>(API_CONFIG.bannersUrl, fd);
  }

  update(id: number, fd: FormData): Observable<IBanner> {
    return this.http.put<IBanner>(`${API_CONFIG.bannersUrl}/${id}`, fd);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.bannersUrl}/${id}`);
  }
}
