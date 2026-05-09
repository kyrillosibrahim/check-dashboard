import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IExternalWebsite } from '../models/external-website.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ExternalWebsiteService {
  private http = inject(HttpClient);

  getAll(): Observable<IExternalWebsite[]> {
    return this.http.get<IExternalWebsite[]>(API_CONFIG.externalWebsitesUrl);
  }

  create(data: { name: string; logoUrl: string }): Observable<IExternalWebsite> {
    return this.http.post<IExternalWebsite>(API_CONFIG.externalWebsitesUrl, data);
  }

  update(id: number, data: { name: string; logoUrl: string }): Observable<IExternalWebsite> {
    return this.http.put<IExternalWebsite>(`${API_CONFIG.externalWebsitesUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.externalWebsitesUrl}/${id}`);
  }
}
