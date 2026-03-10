import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProduct } from '../models/product.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getAll(): Observable<IProduct[]> {
    return this.http.get<IProduct[]>(API_CONFIG.productsUrl);
  }

  getProduct(category: string, slug: string): Observable<IProduct> {
    return this.http.get<IProduct>(`${API_CONFIG.productsUrl}/${category}/${slug}`);
  }

  createProduct(product: IProduct): Observable<{ message: string; product: IProduct; folder: string }> {
    return new Observable(observer => {
      this.buildFormData(product).then(formData => {
        this.http.post<{ message: string; product: IProduct; folder: string }>(API_CONFIG.productsUrl, formData)
          .subscribe({ next: v => { observer.next(v); observer.complete(); }, error: e => observer.error(e) });
      }).catch(e => observer.error(e));
    });
  }

  updateProduct(product: IProduct): Observable<{ message: string; product: IProduct; folder: string }> {
    return new Observable(observer => {
      this.buildFormData(product).then(formData => {
        this.http.post<{ message: string; product: IProduct; folder: string }>(`${API_CONFIG.productsUrl}?overwrite=true`, formData)
          .subscribe({ next: v => { observer.next(v); observer.complete(); }, error: e => observer.error(e) });
      }).catch(e => observer.error(e));
    });
  }

  deleteProduct(category: string, slug: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.productsUrl}/${category}/${slug}`);
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u0600-\u06FF-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  generateId(): string {
    return 'prod-' + Date.now().toString(36);
  }

  private async buildFormData(product: IProduct): Promise<FormData> {
    const fd = new FormData();
    const slug = product.slug || this.generateSlug(product.title);

    fd.append('productName', product.title);
    fd.append('slug', slug);
    fd.append('category', product.category);
    fd.append('categoryId', String(product.categoryId ?? ''));
    if (product.categoryFolder) fd.append('categoryFolder', product.categoryFolder);
    fd.append('description', product.description || '');
    fd.append('descriptionAr', product.descriptionAr || '');
    fd.append('descriptionHtml', product.descriptionHtml || '');
    fd.append('descriptionHtmlAr', product.descriptionHtmlAr || '');
    fd.append('titleAr', product.titleAr || '');
    fd.append('brand', product.brand || '');
    fd.append('merchant', product.merchant || '');
    fd.append('price', String(product.price || 0));
    fd.append('wholesalePrice', String(product.wholesalePrice || 0));
    fd.append('originalPrice', String(product.originalPrice || product.price || 0));
    fd.append('discountedPrice', String(product.discountedPrice || 0));
    fd.append('stock', String(product.stock || 0));
    fd.append('rating', String(product.rating || 0));
    fd.append('ratingsCount', String(product.ratingsCount || 0));
    fd.append('isFeatured', String(product.isFeatured || false));
    fd.append('comingSoon', String(product.comingSoon || false));
    fd.append('id', product.id || '');
    fd.append('subcategory', product.subcategory || '');

    if (product.tags?.length) fd.append('tags', JSON.stringify(product.tags));
    if (product.filterTags?.length) fd.append('filterTags', JSON.stringify(product.filterTags));
    if (product.productForm) fd.append('productForm', JSON.stringify(product.productForm));
    if (product.faq?.length) fd.append('faq', JSON.stringify(product.faq));
    if (product.offers?.length) fd.append('offers', JSON.stringify(product.offers));

    await this.appendImages(fd, 'mainImages', product.images);
    await this.appendImages(fd, 'swiperImages', product.swiperImages);
    await this.appendImages(fd, 'normalImages', product.naturalImages);

    return fd;
  }

  private async appendImages(fd: FormData, fieldName: string, images?: string[]): Promise<void> {
    if (!images?.length) return;
    for (let i = 0; i < images.length; i++) {
      const src = images[i];
      if (src.startsWith('data:')) {
        // New image (base64) — convert to blob
        const blob = this.base64ToBlob(src);
        if (blob) {
          const file = new File([blob], `img-${i + 1}.webp`, { type: blob.type });
          fd.append(fieldName, file);
        }
      } else if (src.startsWith('http')) {
        // Existing server image — fetch and re-upload
        try {
          const response = await fetch(src);
          const blob = await response.blob();
          const ext = src.split('.').pop() || 'webp';
          const file = new File([blob], `img-${i + 1}.${ext}`, { type: blob.type });
          fd.append(fieldName, file);
        } catch {
          console.warn(`Failed to fetch image: ${src}`);
        }
      }
    }
  }

  private base64ToBlob(dataUrl: string): Blob | null {
    if (!dataUrl?.startsWith('data:')) return null;
    try {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/webp';
      const byteStr = atob(parts[1]);
      const ab = new ArrayBuffer(byteStr.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteStr.length; i++) {
        ia[i] = byteStr.charCodeAt(i);
      }
      return new Blob([ab], { type: mime });
    } catch {
      return null;
    }
  }
}
