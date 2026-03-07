import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { API_CONFIG } from '../../../../core/config/api.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-edit',
  imports: [ProductFormComponent],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss'
})
export class ProductEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private merchantService = inject(MerchantService);
  private cdr = inject(ChangeDetectorRef);

  product: IProduct | null = null;
  categories: ICategory[] = [];
  brands: IBrand[] = [];
  merchants: IMerchant[] = [];

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

    const category = this.route.snapshot.paramMap.get('category')!;
    const slug = this.route.snapshot.paramMap.get('slug')!;

    this.productService.getProduct(category, slug).subscribe({
      next: (p) => {
        const toFullUrl = (path: string) => {
          if (!path) return '';
          if (path.startsWith('http') || path.startsWith('data:')) return path;
          return `${API_CONFIG.uploadsUrl}/${path}`;
        };

        if (p.mainImages?.length) {
          p.images = p.mainImages.map(toFullUrl);
        }
        if (p.swiperImages?.length) {
          p.swiperImages = p.swiperImages.map(toFullUrl);
        }
        if (p.normalImages?.length) {
          p.naturalImages = p.normalImages.map(toFullUrl);
        }

        this.product = { ...p, categoryFolder: category };
        this.cdr.markForCheck();
      },
      error: () => {
        this.router.navigate(['/products']);
      }
    });
  }

  async onSave(product: IProduct): Promise<void> {
    try {
      await firstValueFrom(this.productService.updateProduct(product));

      await Swal.fire({
        title: 'تم تحديث المنتج بنجاح!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      this.router.navigate(['/products']);
    } catch (err: any) {
      Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
