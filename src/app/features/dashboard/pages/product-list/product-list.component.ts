import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { MerchantService } from '../../../../core/services/merchant.service';
import { BrandService } from '../../../../core/services/brand.service';
import { IProduct } from '../../../../core/models/product.model';
import { ICategory } from '../../../../core/models/category.model';
import { IMerchant } from '../../../../core/models/merchant.model';
import { IBrand } from '../../../../core/models/brand.model';
import { ProductTableComponent } from '../../components/product-table/product-table.component';
import { BackupService } from '../../../../core/services/backup.service';
import { API_CONFIG } from '../../../../core/config/api.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-list',
  imports: [ProductTableComponent, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private merchantService = inject(MerchantService);
  private brandService = inject(BrandService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  allProducts: IProduct[] = [];
  products: IProduct[] = [];
  categories: ICategory[] = [];
  merchants: IMerchant[] = [];
  brands: IBrand[] = [];

  selectedCategory = '';
  selectedMerchant = '';
  selectedBrand = '';

  isLoading = true;
  error = '';

  search(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedMerchant = '';
    this.selectedBrand = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.allProducts;

    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    if (this.selectedMerchant) {
      filtered = filtered.filter(p => p.merchant === this.selectedMerchant);
    }
    if (this.selectedBrand) {
      filtered = filtered.filter(p => p.brand === this.selectedBrand);
    }

    this.products = filtered;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });
    this.merchantService.getAll().subscribe(m => {
      this.merchants = m;
      this.cdr.markForCheck();
    });
    this.brandService.getAll().subscribe(b => {
      this.brands = b;
      this.cdr.markForCheck();
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    this.productService.getAll().subscribe({
      next: (p) => {
        this.allProducts = p;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل المنتجات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onEdit(product: IProduct): void {
    const category = product.categoryFolder || this.productService.generateSlug(product.category);
    this.router.navigate(['/edit', category, product.slug]);
  }

  async onDelete(product: IProduct): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: product.title,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      const category = product.categoryFolder || this.productService.generateSlug(product.category);
      this.productService.deleteProduct(category, product.slug!).subscribe({
        next: () => {
          Swal.fire('تم حذف المنتج!', '', 'success');
          this.loadProducts();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  // ─── Backup / Restore ───

  private toFullUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${API_CONFIG.uploadsUrl}/${path}`;
  }

  async downloadBackup(): Promise<void> {
    if (!this.allProducts.length) {
      Swal.fire('تنبيه', 'لا توجد منتجات لتحميلها', 'warning');
      return;
    }

    Swal.fire({ title: 'جاري تجهيز النسخة الاحتياطية...', html: '0 / ' + this.allProducts.length, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const productsWithImages = [];
    for (let i = 0; i < this.allProducts.length; i++) {
      const p = this.allProducts[i];
      Swal.update({ html: `${i + 1} / ${this.allProducts.length}` });

      const convertImages = async (paths: string[] | undefined): Promise<string[]> => {
        if (!paths?.length) return [];
        const results: string[] = [];
        for (const imgPath of paths) {
          const url = this.toFullUrl(imgPath);
          if (url) {
            const base64 = await this.backupService.imageToBase64(url);
            results.push(base64 || url);
          }
        }
        return results;
      };

      // API returns mainImages/normalImages, but buildFormData reads images/naturalImages
      const images = await convertImages(p.mainImages?.length ? p.mainImages : p.images);
      const swiperImages = await convertImages(p.swiperImages);
      const naturalImages = await convertImages(p.normalImages?.length ? p.normalImages : p.naturalImages);

      productsWithImages.push({ ...p, images, swiperImages, naturalImages, mainImages: undefined, normalImages: undefined });
    }

    this.backupService.downloadJson(productsWithImages, 'products_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<IProduct[]>();
      if (!Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات منتجات صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم رفع <b>${data.length}</b> منتج من الملف.<br>هل تريد المتابعة؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، استرجع',
        cancelButtonText: 'إلغاء',
      });
      if (!confirm.isConfirmed) return;

      Swal.fire({ title: 'جاري الاسترجاع...', html: '0 / ' + data.length, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      let success = 0;
      let failed = 0;
      for (let i = 0; i < data.length; i++) {
        const product = data[i];
        Swal.update({ html: `${i + 1} / ${data.length}` });

        // Ensure images are in the fields buildFormData expects
        if (!product.images?.length && product.mainImages?.length) {
          product.images = product.mainImages;
        }
        if (!product.naturalImages?.length && product.normalImages?.length) {
          product.naturalImages = product.normalImages;
        }

        try {
          await new Promise<void>((resolve) => {
            this.productService.updateProduct(product).subscribe({
              next: () => { success++; resolve(); },
              error: () => { failed++; resolve(); }
            });
          });
        } catch {
          failed++;
        }
      }
      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}`, success > 0 ? 'success' : 'error');
      this.loadProducts();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
