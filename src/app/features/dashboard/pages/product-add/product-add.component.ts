import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { MerchantService } from '../../../../core/services/merchant.service';
import { IProduct } from '../../../../core/models/product.model';
import { ICategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
import { IMerchant } from '../../../../core/models/merchant.model';
import { ProductFormComponent } from '../../components/product-form/product-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-add',
  imports: [ProductFormComponent],
  templateUrl: './product-add.component.html',
  styleUrl: './product-add.component.scss'
})
export class ProductAddComponent {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private merchantService = inject(MerchantService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  categories: ICategory[] = [];
  brands: IBrand[] = [];
  merchants: IMerchant[] = [];
  isSaving = false;

  constructor() {
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

  async onSave(product: IProduct): Promise<void> {
    this.isSaving = true;
    try {
      await firstValueFrom(this.productService.createProduct({
        ...product,
        id: this.productService.generateId()
      }));

      await Swal.fire({
        title: 'تم حفظ المنتج بنجاح!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      this.router.navigate(['/products']);
    } catch (err: any) {
      if (err?.status === 409) {
        const confirm = await Swal.fire({
          title: 'المنتج موجود بالفعل!',
          text: `"${product.title}" موجود على السيرفر. عايز تحدثه؟`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'تحديث',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#198754',
        });
        if (confirm.isConfirmed) {
          try {
            await firstValueFrom(this.productService.updateProduct({
              ...product,
              id: this.productService.generateId()
            }));
            await Swal.fire('تم تحديث المنتج!', '', 'success');
            this.router.navigate(['/products']);
          } catch (innerErr: any) {
            Swal.fire('خطأ', innerErr?.error?.error || 'فشل التحديث', 'error');
          }
        }
      } else {
        Swal.fire('خطأ', err?.error?.error || 'فشل الحفظ', 'error');
      }
    } finally {
      this.isSaving = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
