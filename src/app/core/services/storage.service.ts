import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IStorageInfo } from '../models/storage.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private http = inject(HttpClient);

  getStorage(): Observable<IStorageInfo> {
    return this.http.get<IStorageInfo>(API_CONFIG.storageUrl);
  }
}
