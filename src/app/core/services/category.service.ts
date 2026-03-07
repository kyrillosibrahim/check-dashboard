import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICategory } from '../models/category.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(API_CONFIG.categoriesUrl);
  }

  getDetailed(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(`${API_CONFIG.categoriesUrl}/detailed`);
  }

  create(name: string, image?: File): Observable<ICategory> {
    const fd = new FormData();
    fd.append('name', name);
    if (image) fd.append('image', image);
    return this.http.post<ICategory>(API_CONFIG.categoriesUrl, fd);
  }

  update(id: number, name: string, image?: File, famousBrands?: number[]): Observable<ICategory> {
    const fd = new FormData();
    fd.append('name', name);
    if (image) fd.append('image', image);
    if (famousBrands) fd.append('famousBrands', JSON.stringify(famousBrands));
    return this.http.put<ICategory>(`${API_CONFIG.categoriesUrl}/${id}`, fd);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.categoriesUrl}/${id}`);
  }

  // Subcategory CRUD
  addSubcategory(categoryId: number, name: string, image?: File): Observable<ICategory> {
    const fd = new FormData();
    fd.append('name', name);
    if (image) fd.append('image', image);
    return this.http.post<ICategory>(`${API_CONFIG.categoriesUrl}/${categoryId}/subcategories`, fd);
  }

  updateSubcategory(categoryId: number, subId: number, name: string, image?: File): Observable<ICategory> {
    const fd = new FormData();
    fd.append('name', name);
    if (image) fd.append('image', image);
    return this.http.put<ICategory>(`${API_CONFIG.categoriesUrl}/${categoryId}/subcategories/${subId}`, fd);
  }

  deleteSubcategory(categoryId: number, subId: number): Observable<ICategory> {
    return this.http.delete<ICategory>(`${API_CONFIG.categoriesUrl}/${categoryId}/subcategories/${subId}`);
  }
}
