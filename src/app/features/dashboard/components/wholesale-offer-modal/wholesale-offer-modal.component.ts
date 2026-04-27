import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IProduct } from '../../../../core/models/product.model';
import { ICategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
import { IMerchant } from '../../../../core/models/merchant.model';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { MerchantService } from '../../../../core/services/merchant.service';
import { ProductFormComponent } from '../product-form/product-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wholesale-offer-modal',
  imports: [ProductFormComponent],
  templateUrl: './wholesale-offer-modal.component.html',
  styleUrl: './wholesale-offer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WholesaleOfferModalComponent implements OnInit {
  @Input() show = false;
  @Input() product: IProduct | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<IProduct>();

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private merchantService = inject(MerchantService);
  private cdr = inject(ChangeDetectorRef);

  categories: ICategory[] = [];
  brands: IBrand[] = [];
  merchants: IMerchant[] = [];
  isSaving = false;

  ngOnInit(): void {
    this.categoryService.getDetailed().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });
    this.brandService.getAll().subscribe(b => {
      this.brands = b;
      this.cdr.markForCheck();
    });
    this.merchantService.getAll().subscribe(m => {
      this.merchants = m;
      this.cdr.markForCheck();
    });
  }

  get isEdit(): boolean {
    return !!this.product;
  }

  onCancel(): void {
    if (this.isSaving) return;
    this.close.emit();
  }

  async onSave(product: IProduct): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;
    this.cdr.markForCheck();

    const payload: IProduct = {
      ...product,
      isWholesaleOffer: true,
      id: this.isEdit ? product.id : (product.id || this.productService.generateId())
    };

    try {
      const request$ = this.isEdit
        ? this.productService.updateProduct(payload)
        : this.productService.createProduct(payload);
      const result = await firstValueFrom(request$);

      await Swal.fire({
        title: this.isEdit ? 'تم تحديث المنتج!' : 'تم حفظ المنتج بنجاح!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      this.saved.emit(result.product || payload);
      this.close.emit();
    } catch (err: any) {
      if (!this.isEdit && err?.status === 409) {
        const confirm = await Swal.fire({
          title: 'المنتج موجود بالفعل!',
          text: `"${payload.title}" موجود على السيرفر. عايز تحدثه؟`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'تحديث',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#198754',
        });
        if (confirm.isConfirmed) {
          try {
            const result = await firstValueFrom(this.productService.updateProduct(payload));
            await Swal.fire('تم تحديث المنتج!', '', 'success');
            this.saved.emit(result.product || payload);
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
