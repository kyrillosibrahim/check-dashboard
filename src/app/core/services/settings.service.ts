import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISiteSettings } from '../models/settings.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);

  getSettings(): Observable<ISiteSettings> {
    return this.http.get<ISiteSettings>(API_CONFIG.settingsUrl);
  }

  updateSettings(formData: FormData): Observable<ISiteSettings> {
    return this.http.put<ISiteSettings>(API_CONFIG.settingsUrl, formData);
  }
}
