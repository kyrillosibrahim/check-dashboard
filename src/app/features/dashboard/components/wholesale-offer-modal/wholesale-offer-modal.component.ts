import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IProduct } from '../../../../core/models/product.model';
import { IWholesaleOffer } from '../../../../core/models/wholesale-offer.model';
import { WholesaleOfferService } from '../../../../core/services/wholesale-offer.service';
import { ProductFormComponent } from '../product-form/product-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wholesale-offer-modal',
  imports: [ProductFormComponent],
  templateUrl: './wholesale-offer-modal.component.html',
  styleUrl: './wholesale-offer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WholesaleOfferModalComponent {
  @Input() show = false;
  @Input() offer: IWholesaleOffer | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<IWholesaleOffer>();

  private wholesaleService = inject(WholesaleOfferService);
  private cdr = inject(ChangeDetectorRef);

  isSaving = false;

  /** Adapter: ProductFormComponent works with IProduct, so we expose the offer as a product-shaped object. */
  get formProduct(): IProduct | null {
    if (!this.offer) return null;
    return {
      id: this.offer.id,
      title: this.offer.title,
      titleAr: this.offer.titleAr,
      description: this.offer.description || '',
      descriptionAr: this.offer.descriptionAr,
      descriptionHtml: this.offer.descriptionHtml,
      descriptionHtmlAr: this.offer.descriptionHtmlAr,
      price: this.offer.originalPrice,
      discountPercentage: this.offer.discountPercentage || 0,
      rating: 0,
      ratingsCount: 0,
      stock: 0,
      categoryId: 0,
      category: '',
      images: this.offer.mainImages || [],
      swiperImages: this.offer.swiperImages,
      naturalImages: this.offer.normalImages,
      brand: '',
      isFeatured: false,
      tags: [],
      slug: this.offer.slug,
      wholesalePrice: this.offer.wholesalePrice,
      originalPrice: this.offer.originalPrice,
      discountedPrice: this.offer.discountedPrice,
      faq: this.offer.faq,
      offers: this.offer.offers,
      metaTitle: this.offer.metaTitle,
      metaDescription: this.offer.metaDescription,
      seoKeywords: this.offer.seoKeywords,
    };
  }

  get isEdit(): boolean {
    return !!this.offer;
  }

  onCancel(): void {
    if (this.isSaving) return;
    this.close.emit();
  }

  async onSave(product: IProduct): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;
    this.cdr.markForCheck();

    const slug = product.slug || this.wholesaleService.generateSlug(product.title);
    const payload: IWholesaleOffer = {
      id: this.isEdit ? this.offer!.id : (product.id || this.wholesaleService.generateId()),
      slug,
      title: product.title,
      titleAr: product.titleAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      descriptionHtml: product.descriptionHtml,
      descriptionHtmlAr: product.descriptionHtmlAr,
      wholesalePrice: product.wholesalePrice || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discountedPrice: product.discountedPrice || 0,
      images: product.images,
      swiperImages: product.swiperImages,
      naturalImages: product.naturalImages,
      faq: product.faq,
      offers: product.offers,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      seoKeywords: product.seoKeywords,
    };

    try {
      const request$ = this.isEdit
        ? this.wholesaleService.update(payload)
        : this.wholesaleService.create(payload);
      const result = await firstValueFrom(request$);

      await Swal.fire({
        title: this.isEdit ? 'تم تحديث عرض الجملة!' : 'تم حفظ عرض الجملة بنجاح!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      this.saved.emit(result.offer || payload);
      this.close.emit();
    } catch (err: any) {
      if (!this.isEdit && err?.status === 409) {
        const confirm = await Swal.fire({
          title: 'العرض موجود بالفعل!',
          text: `"${payload.title}" موجود على السيرفر. عايز تحدثه؟`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'تحديث',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#198754',
        });
        if (confirm.isConfirmed) {
          try {
            const result = await firstValueFrom(this.wholesaleService.update(payload));
            await Swal.fire('تم تحديث العرض!', '', 'success');
            this.saved.emit(result.offer || payload);
            this.close.emit();
          } catch (innerErr: any) {
            Swal.fire('خطأ', innerErr?.error?.error || 'فشل التحديث', 'error');
          }
        }
      } else {
        Swal.fire('خطأ', err?.error?.error || 'فشل الحفظ', 'error');
      }
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }
}
