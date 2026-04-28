import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IWholesaleOffer } from '../models/wholesale-offer.model';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class WholesaleOfferService {
  private http = inject(HttpClient);

  getAll(): Observable<IWholesaleOffer[]> {
    return this.http.get<IWholesaleOffer[]>(API_CONFIG.wholesaleOffersUrl);
  }

  getById(idOrSlug: string): Observable<IWholesaleOffer> {
    return this.http.get<IWholesaleOffer>(`${API_CONFIG.wholesaleOffersUrl}/${idOrSlug}`);
  }

  create(offer: IWholesaleOffer): Observable<{ message: string; offer: IWholesaleOffer }> {
    return new Observable(observer => {
      this.buildFormData(offer).then(fd => {
        this.http.post<{ message: string; offer: IWholesaleOffer }>(API_CONFIG.wholesaleOffersUrl, fd)
          .subscribe({ next: v => { observer.next(v); observer.complete(); }, error: e => observer.error(e) });
      }).catch(e => observer.error(e));
    });
  }

  update(offer: IWholesaleOffer): Observable<{ message: string; offer: IWholesaleOffer }> {
    return new Observable(observer => {
      this.buildFormData(offer).then(fd => {
        this.http.post<{ message: string; offer: IWholesaleOffer }>(`${API_CONFIG.wholesaleOffersUrl}?overwrite=true`, fd)
          .subscribe({ next: v => { observer.next(v); observer.complete(); }, error: e => observer.error(e) });
      }).catch(e => observer.error(e));
    });
  }

  delete(idOrSlug: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_CONFIG.wholesaleOffersUrl}/${idOrSlug}`);
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
    return 'wholesale-' + Date.now().toString(36);
  }

  private async buildFormData(offer: IWholesaleOffer): Promise<FormData> {
    const fd = new FormData();
    const slug = offer.slug || this.generateSlug(offer.title);

    fd.append('title', offer.title);
    fd.append('slug', slug);
    fd.append('id', offer.id || ('wholesale-' + slug));
    fd.append('titleAr', offer.titleAr || '');
    fd.append('description', offer.description || '');
    fd.append('descriptionAr', offer.descriptionAr || '');
    fd.append('descriptionHtml', offer.descriptionHtml || '');
    fd.append('descriptionHtmlAr', offer.descriptionHtmlAr || '');
    fd.append('wholesalePrice', String(offer.wholesalePrice || 0));
    fd.append('originalPrice', String(offer.originalPrice || 0));
    fd.append('discountedPrice', String(offer.discountedPrice || 0));
    fd.append('minWholesaleQuantity', String(offer.minWholesaleQuantity || 0));

    if (offer.faq?.length) fd.append('faq', JSON.stringify(offer.faq));
    if (offer.offers?.length) fd.append('offers', JSON.stringify(offer.offers));
    if (offer.metaTitle) fd.append('metaTitle', offer.metaTitle);
    if (offer.metaDescription) fd.append('metaDescription', offer.metaDescription);
    if (offer.seoKeywords?.length) fd.append('seoKeywords', JSON.stringify(offer.seoKeywords));

    await this.appendImages(fd, 'mainImages', offer.images || offer.mainImages);
    await this.appendImages(fd, 'swiperImages', offer.swiperImages);
    await this.appendImages(fd, 'normalImages', offer.naturalImages || offer.normalImages);

    return fd;
  }

  private async appendImages(fd: FormData, fieldName: string, images?: string[]): Promise<void> {
    if (!images?.length) return;
    for (let i = 0; i < images.length; i++) {
      const src = images[i];
      if (src.startsWith('data:')) {
        const blob = this.base64ToBlob(src);
        if (blob) {
          const file = new File([blob], `img-${i + 1}.webp`, { type: blob.type });
          fd.append(fieldName, file);
        }
      } else if (src.startsWith('http')) {
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
