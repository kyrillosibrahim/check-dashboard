import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CategoryService } from '../../../../core/services/category.service';
import { ProductService } from '../../../../core/services/product.service';
import { MerchantService } from '../../../../core/services/merchant.service';
import { PriceComparisonService } from '../../../../core/services/price-comparison.service';
import { ICategory } from '../../../../core/models/category.model';
import { IProduct } from '../../../../core/models/product.model';
import { IMerchant } from '../../../../core/models/merchant.model';
import { IPriceComparison, IMerchantPrice } from '../../../../core/models/price-comparison.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-price-compare',
  imports: [FormsModule, EgpCurrencyPipe],
  templateUrl: './price-compare.component.html',
  styleUrl: './price-compare.component.scss'
})
export class PriceCompareComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private merchantService = inject(MerchantService);
  private compareService = inject(PriceComparisonService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  categories: ICategory[] = [];
  allProducts: IProduct[] = [];
  merchants: IMerchant[] = [];
  comparisons: IPriceComparison[] = [];

  // Add/Edit form state
  showForm = false;
  editingId: number | null = null;
  selectedCategory = '';
  productSearch = '';
  selectedProduct: IProduct | null = null;
  sellingPrice = 0;
  merchantRows: IMerchantPrice[] = [];

  showProductDropdown = false;

  // Table filters
  filterCategory = '';
  filterSearch = '';

  // Loading
  isLoading = true;
  isSaving = false;

  get filteredProducts(): IProduct[] {
    if (!this.selectedCategory) return [];
    const selectedCat = this.categories.find(c => c.slug === this.selectedCategory);
    let products = this.allProducts.filter(p => p.category === this.selectedCategory || (selectedCat && p.categoryId === selectedCat.id));
    if (this.productSearch.trim()) {
      const q = this.productSearch.trim().toLowerCase();
      products = products.filter(p =>
        (p.title?.toLowerCase().includes(q)) ||
        (p.titleAr?.toLowerCase().includes(q))
      );
    }
    return products;
  }

  get filteredComparisons(): IPriceComparison[] {
    let list = this.comparisons;
    if (this.filterCategory) {
      list = list.filter(c => c.categorySlug === this.filterCategory);
    }
    if (this.filterSearch.trim()) {
      const q = this.filterSearch.trim().toLowerCase();
      list = list.filter(c => c.productName.toLowerCase().includes(q));
    }
    return list;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    Promise.all([
      firstValueFrom(this.categoryService.getAll()),
      firstValueFrom(this.productService.getAll()),
      firstValueFrom(this.merchantService.getAll()),
      firstValueFrom(this.compareService.getAll()),
    ]).then(([categories, products, merchants, comparisons]) => {
      this.categories = categories;
      this.allProducts = products;
      this.merchants = merchants;
      this.comparisons = comparisons;
      this.isLoading = false;
      this.cdr.markForCheck();
    }).catch(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
      Swal.fire('خطأ', 'فشل تحميل البيانات. تأكد أن السيرفر شغال.', 'error');
    });
  }

  // ─── Form Actions ───

  openAddForm(): void {
    this.editingId = null;
    this.selectedCategory = '';
    this.productSearch = '';
    this.selectedProduct = null;
    this.sellingPrice = 0;
    this.merchantRows = [{ merchantName: '', originalPrice: 0, wholesalePrice: 0, sellingPrice: 0 }];
    this.showForm = true;
    this.cdr.markForCheck();
  }

  openEditForm(comp: IPriceComparison): void {
    this.editingId = comp.id;
    this.selectedCategory = comp.categorySlug;
    this.productSearch = '';
    this.selectedProduct = this.allProducts.find(p => p.id === comp.productId) || null;
    this.sellingPrice = comp.sellingPrice;
    this.merchantRows = comp.merchants.map(m => ({ ...m }));
    this.showForm = true;
    this.cdr.markForCheck();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.cdr.markForCheck();
  }

  selectProduct(product: IProduct): void {
    this.selectedProduct = product;
    this.productSearch = '';
    this.showProductDropdown = false;
    if (product.price && !this.sellingPrice) {
      this.sellingPrice = product.price;
    }
    this.cdr.markForCheck();
  }

  onProductBlur(): void {
    setTimeout(() => {
      this.showProductDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }

  addMerchantRow(): void {
    this.merchantRows.push({ merchantName: '', originalPrice: 0, wholesalePrice: 0, sellingPrice: 0 });
    this.cdr.markForCheck();
  }

  removeMerchantRow(index: number): void {
    this.merchantRows.splice(index, 1);
    this.cdr.markForCheck();
  }

  async saveComparison(): Promise<void> {
    if (!this.selectedProduct) {
      Swal.fire('تنبيه', 'اختر منتج أولاً', 'warning');
      return;
    }

    const validMerchants = this.merchantRows.filter(m => m.merchantName.trim());
    if (validMerchants.length === 0) {
      Swal.fire('تنبيه', 'أضف تاجر واحد على الأقل', 'warning');
      return;
    }

    // Set selling price on each merchant row
    const merchants = validMerchants.map(m => ({
      ...m,
      merchantName: m.merchantName.trim(),
      sellingPrice: this.sellingPrice,
    }));

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      if (this.editingId) {
        await firstValueFrom(this.compareService.update(this.editingId, {
          merchants,
          sellingPrice: this.sellingPrice,
          productName: this.selectedProduct.titleAr || this.selectedProduct.title,
          categorySlug: this.selectedCategory,
        }));
        Swal.fire({ title: 'تم التحديث!', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await firstValueFrom(this.compareService.create({
          productId: this.selectedProduct.id,
          productName: this.selectedProduct.titleAr || this.selectedProduct.title,
          categorySlug: this.selectedCategory,
          merchants,
          sellingPrice: this.sellingPrice,
        }));
        Swal.fire({ title: 'تم الإضافة!', icon: 'success', timer: 1500, showConfirmButton: false });
      }

      this.showForm = false;
      this.editingId = null;
      // Reload comparisons
      const comparisons = await firstValueFrom(this.compareService.getAll());
      this.comparisons = comparisons;
    } catch (err: any) {
      if (err?.status === 409) {
        Swal.fire('تنبيه', 'هذا المنتج موجود بالفعل فى المقارنة', 'warning');
      } else {
        Swal.fire('خطأ', 'فشل الحفظ', 'error');
      }
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  async deleteComparison(comp: IPriceComparison): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف مقارنة "${comp.productName}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفها!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      try {
        await firstValueFrom(this.compareService.delete(comp.id));
        this.comparisons = this.comparisons.filter(c => c.id !== comp.id);
        Swal.fire({ title: 'تم الحذف!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.cdr.markForCheck();
      } catch {
        Swal.fire('خطأ', 'فشل الحذف', 'error');
      }
    }
  }

  getCategoryName(slug: string): string {
    const cat = this.categories.find(c => c.slug === slug);
    return cat?.name || slug;
  }
}
