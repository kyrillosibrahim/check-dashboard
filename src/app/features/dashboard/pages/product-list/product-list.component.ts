import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
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

const PAGE_SIZE = 25;

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
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  readonly pageSize = PAGE_SIZE;

  products: IProduct[] = [];
  categories: ICategory[] = [];
  merchants: IMerchant[] = [];
  brands: IBrand[] = [];

  selectedCategory = '';
  selectedMerchant = '';
  selectedBrand = '';
  searchName = '';

  currentPage = 1;
  totalProducts = 0;
  totalPages = 0;

  isLoading = true;
  error = '';
  retryMessage = '';
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 15;

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

    this.route.queryParams.subscribe(params => {
      this.currentPage = Math.max(1, parseInt(params['page'], 10) || 1);
      this.selectedCategory = params['category'] || '';
      this.selectedMerchant = params['merchant'] || '';
      this.selectedBrand = params['brand'] || '';
      this.searchName = params['name'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.clearRetryTimer();
    this.isLoading = true;
    this.error = '';
    this.retryMessage = '';
    this.productService
      .getPaginated({
        page: this.currentPage,
        limit: this.pageSize,
        category: this.selectedCategory || undefined,
        brand: this.selectedBrand || undefined,
        merchant: this.selectedMerchant || undefined,
        name: this.searchName || undefined,
      })
      .subscribe({
        next: ({ products, total }) => {
          this.retryCount = 0;
          this.products = products;
          this.totalProducts = total;
          this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));

          if (this.currentPage > this.totalPages && total > 0) {
            this.navigateTo({ page: this.totalPages });
            return;
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          if (this.retryCount < this.MAX_RETRIES) {
            this.startRetryCountdown();
          } else {
            this.retryCount = 0;
            this.error = 'فشل تحميل المنتجات. تأكد أن السيرفر شغال.';
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        }
      });
  }

  private startRetryCountdown(): void {
    this.retryCount++;
    this.isLoading = false;
    let seconds = this.RETRY_DELAY;
    this.retryMessage = `السيرفر بيصحى... إعادة المحاولة خلال ${seconds} ثانية (${this.retryCount}/${this.MAX_RETRIES})`;
    this.cdr.markForCheck();

    const tick = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(tick);
        this.retryMessage = '';
        this.loadProducts();
      } else {
        this.retryMessage = `السيرفر بيصحى... إعادة المحاولة خلال ${seconds} ثانية (${this.retryCount}/${this.MAX_RETRIES})`;
      }
      this.cdr.markForCheck();
    }, 1000);

    this.retryTimer = setTimeout(() => clearInterval(tick), (this.RETRY_DELAY + 2) * 1000);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  search(): void {
    this.navigateTo({
      page: 1,
      category: this.selectedCategory || null,
      merchant: this.selectedMerchant || null,
      brand: this.selectedBrand || null,
      name: this.searchName || null,
    });
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedMerchant = '';
    this.selectedBrand = '';
    this.searchName = '';
    this.navigateTo({ page: null, category: null, merchant: null, brand: null, name: null });
  }

  goToPage(n: number): void {
    if (n < 1 || n > this.totalPages || n === this.currentPage) return;
    this.navigateTo({ page: n });
  }

  get rangeStart(): number {
    return this.totalProducts === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalProducts);
  }

  get pageNumbers(): number[] {
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    const result: number[] = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }

  private navigateTo(merge: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: merge,
      queryParamsHandling: 'merge',
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
          if (this.products.length === 1 && this.currentPage > 1) {
            this.navigateTo({ page: this.currentPage - 1 });
          } else {
            this.loadProducts();
          }
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

  private async fetchAllProducts(): Promise<IProduct[]> {
    return new Promise((resolve, reject) => {
      this.productService.getAll().subscribe({
        next: (list) => resolve([...list].reverse()),
        error: (err) => reject(err),
      });
    });
  }

  async downloadBackup(): Promise<void> {
    Swal.fire({ title: 'جاري تحميل قائمة المنتجات...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    let allProducts: IProduct[];
    try {
      allProducts = await this.fetchAllProducts();
    } catch {
      Swal.fire('خطأ', 'فشل تحميل المنتجات', 'error');
      return;
    }

    if (!allProducts.length) {
      Swal.fire('تنبيه', 'لا توجد منتجات لتحميلها', 'warning');
      return;
    }

    Swal.fire({ title: 'جاري تجهيز النسخة الاحتياطية...', html: '0 / ' + allProducts.length, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const productsWithImages = [];
    for (let i = 0; i < allProducts.length; i++) {
      const p = allProducts[i];
      Swal.update({ html: `${i + 1} / ${allProducts.length}` });

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
