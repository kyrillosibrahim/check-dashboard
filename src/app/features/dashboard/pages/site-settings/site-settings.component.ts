import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../../core/services/settings.service';
import { ProductService } from '../../../../core/services/product.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ISiteSettings } from '../../../../core/models/settings.model';
import { IProduct } from '../../../../core/models/product.model';
import { IBrand } from '../../../../core/models/brand.model';
import { ICategory } from '../../../../core/models/category.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import { BackupService } from '../../../../core/services/backup.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { PasteImageDirective } from '../../../../core/directives/paste-image.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-site-settings',
  imports: [FormsModule, PasteImageDirective],
  templateUrl: './site-settings.component.html',
  styleUrl: './site-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private brandService = inject(BrandService);
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);
  private cloudinaryService = inject(CloudinaryService);

  settings: ISiteSettings = {
    logo: '',
    colors: { primaryLight: '#4a90d9', primaryDark: '#4dabf7', secondaryLight: '#1bbc9b', secondaryDark: '#20c9a6' },
    social: { facebook: '', instagram: '', whatsapp: '', phone: '' },
    bestSellingProducts: [],
    bestSellingBrands: [],
  };

  // Logo
  logoFile: File | null = null;
  logoPreview: string | null = null;
  logoArFile: File | null = null;
  logoArPreview: string | null = null;
  logoEnFile: File | null = null;
  logoEnPreview: string | null = null;
  logoIconFile: File | null = null;
  logoIconPreview: string | null = null;

  // Natural products (videos with links)
  naturalProducts: { video: string; link: string }[] = [];
  uploadingVideoIndex: number | null = null;

  // Per-row state for the natural-products product picker
  naturalProductSelected: (IProduct | null)[] = [];
  naturalSearch: string[] = [];
  naturalDropdownIndex: number | null = null;

  // All products, brands & categories for selection
  allProducts: IProduct[] = [];
  allBrands: IBrand[] = [];
  categories: ICategory[] = [];
  productCategoryFilter = '';

  // Selected items (full objects for display)
  selectedProducts: IProduct[] = [];
  selectedBrands: IBrand[] = [];

  // Dropdown search
  productSearch = '';
  brandSearch = '';
  showProductDropdown = false;
  showBrandDropdown = false;

  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.error = '';

    // Load settings, products, and brands in parallel
    this.settingsService.getSettings().subscribe({
      next: (s) => {
        this.settings = s;
        if (s.logo) {
          this.logoPreview = s.logo.startsWith('http') ? s.logo : `${API_CONFIG.uploadsUrl}/${s.logo}`;
        }
        if (s.logoAr)   this.logoArPreview   = s.logoAr.startsWith('http')   ? s.logoAr   : `${API_CONFIG.uploadsUrl}/${s.logoAr}`;
        if (s.logoEn)   this.logoEnPreview   = s.logoEn.startsWith('http')   ? s.logoEn   : `${API_CONFIG.uploadsUrl}/${s.logoEn}`;
        if (s.logoIcon) this.logoIconPreview = s.logoIcon.startsWith('http') ? s.logoIcon : `${API_CONFIG.uploadsUrl}/${s.logoIcon}`;
        this.naturalProducts = (s.naturalProducts || []).map(i => ({ video: i.video || '', link: i.link || '' }));
        this.loadCategories();
        this.loadProducts();
        this.loadBrands();
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل الإعدادات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.allProducts = products;
        const bestIds = (this.settings.bestSellingProducts as any[]).map(
          item => typeof item === 'object' ? item.id : item
        );
        this.selectedProducts = products.filter(p => bestIds.includes(p.id));
        this.hydrateNaturalSelection();
        this.checkLoaded();
      },
      error: () => this.checkLoaded()
    });
  }

  /** Resolve `link` strings (e.g. "/product/prod-abc") back to product objects for display */
  private hydrateNaturalSelection(): void {
    this.naturalProductSelected = this.naturalProducts.map(item => {
      const id = this.extractProductId(item.link);
      return id ? this.allProducts.find(p => p.id === id) || null : null;
    });
    this.naturalSearch = this.naturalProducts.map(() => '');
  }

  private extractProductId(link: string): string | null {
    if (!link) return null;
    const match = link.match(/\/product\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private loadBrands(): void {
    this.brandService.getAll().subscribe({
      next: (brands) => {
        this.allBrands = brands;
        this.selectedBrands = brands.filter(b => this.settings.bestSellingBrands.includes(b.id));
        this.checkLoaded();
      },
      error: () => this.checkLoaded()
    });
  }

  private checkLoaded(): void {
    if (this.allProducts.length >= 0 && this.allBrands.length >= 0) {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  // --- Logo ---
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.setLogoFile('main', input.files[0]);
  }
  onLogoPasted(file: File): void { this.setLogoFile('main', file); }

  onLogoArSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.setLogoFile('ar', input.files[0]);
  }
  onLogoArPasted(file: File): void { this.setLogoFile('ar', file); }

  onLogoEnSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.setLogoFile('en', input.files[0]);
  }
  onLogoEnPasted(file: File): void { this.setLogoFile('en', file); }

  onLogoIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.setLogoFile('icon', input.files[0]);
  }
  onLogoIconPasted(file: File): void { this.setLogoFile('icon', file); }

  private setLogoFile(slot: 'main' | 'ar' | 'en' | 'icon', file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (slot === 'main')  { this.logoFile     = file; this.logoPreview     = url; }
      if (slot === 'ar')    { this.logoArFile   = file; this.logoArPreview   = url; }
      if (slot === 'en')    { this.logoEnFile   = file; this.logoEnPreview   = url; }
      if (slot === 'icon')  { this.logoIconFile = file; this.logoIconPreview = url; }
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  // --- Natural Products (videos with links) ---
  addNaturalProduct(): void {
    this.naturalProducts = [...this.naturalProducts, { video: '', link: '' }];
    this.naturalProductSelected = [...this.naturalProductSelected, null];
    this.naturalSearch = [...this.naturalSearch, ''];
    this.cdr.markForCheck();
  }

  removeNaturalProduct(index: number): void {
    this.naturalProducts = this.naturalProducts.filter((_, i) => i !== index);
    this.naturalProductSelected = this.naturalProductSelected.filter((_, i) => i !== index);
    this.naturalSearch = this.naturalSearch.filter((_, i) => i !== index);
    if (this.naturalDropdownIndex === index) this.naturalDropdownIndex = null;
    this.cdr.markForCheck();
  }

  filteredNaturalProducts(index: number): IProduct[] {
    const term = (this.naturalSearch[index] || '').trim().toLowerCase();
    const list = term
      ? this.allProducts.filter(p =>
          (p.title?.toLowerCase().includes(term)) ||
          (p.titleAr?.toLowerCase().includes(term))
        )
      : this.allProducts;
    return list.slice(0, 30);
  }

  selectNaturalProduct(index: number, product: IProduct): void {
    this.naturalProductSelected[index] = product;
    this.naturalProducts[index] = {
      ...this.naturalProducts[index],
      link: `/product/${product.id}`
    };
    this.naturalSearch[index] = '';
    this.naturalDropdownIndex = null;
    this.cdr.markForCheck();
  }

  clearNaturalProduct(index: number): void {
    this.naturalProductSelected[index] = null;
    this.naturalProducts[index] = { ...this.naturalProducts[index], link: '' };
    this.cdr.markForCheck();
  }

  openNaturalDropdown(index: number): void {
    this.naturalDropdownIndex = index;
    this.cdr.markForCheck();
  }

  onNaturalDropdownBlur(): void {
    setTimeout(() => {
      this.naturalDropdownIndex = null;
      this.cdr.markForCheck();
    }, 200);
  }

  onNaturalVideoSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processNaturalVideo(file, index);
    input.value = '';
  }

  onNaturalVideoPasted(file: File, index: number): void {
    this.processNaturalVideo(file, index);
  }

  private async processNaturalVideo(file: File, index: number): Promise<void> {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      Swal.fire('خطأ', 'الملف لازم يكون فيديو أو صورة', 'error');
      return;
    }
    this.uploadingVideoIndex = index;
    this.cdr.markForCheck();
    try {
      const url = isVideo
        ? await this.cloudinaryService.uploadVideo(file, 'natural-products')
        : await this.cloudinaryService.uploadImage(file, 'natural-products');
      this.naturalProducts[index] = { ...this.naturalProducts[index], video: url };
    } catch (e: any) {
      Swal.fire('خطأ', e?.message || 'فشل رفع الملف', 'error');
    } finally {
      this.uploadingVideoIndex = null;
      this.cdr.markForCheck();
    }
  }

  // --- Product selection ---
  get filteredProducts(): IProduct[] {
    if (!this.productCategoryFilter) return [];
    const selectedIds = this.selectedProducts.map(p => p.id);
    const selectedCat = this.categories.find(c => c.slug === this.productCategoryFilter);
    return this.allProducts
      .filter(p => !selectedIds.includes(p.id))
      .filter(p => p.category === this.productCategoryFilter || (selectedCat && p.categoryId === selectedCat.id))
      .filter(p => {
        if (!this.productSearch.trim()) return true;
        const q = this.productSearch.toLowerCase();
        return (p.title?.toLowerCase().includes(q)) || (p.titleAr?.toLowerCase().includes(q));
      });
  }

  addProduct(product: IProduct): void {
    this.selectedProducts.push(product);
    this.productSearch = '';
    this.showProductDropdown = false;
    this.cdr.markForCheck();
  }

  removeProduct(product: IProduct): void {
    this.selectedProducts = this.selectedProducts.filter(p => p.id !== product.id);
    this.cdr.markForCheck();
  }

  // --- Brand selection ---
  get filteredBrands(): IBrand[] {
    const selectedIds = this.selectedBrands.map(b => b.id);
    return this.allBrands
      .filter(b => !selectedIds.includes(b.id))
      .filter(b => {
        if (!this.brandSearch.trim()) return true;
        return b.name?.toLowerCase().includes(this.brandSearch.toLowerCase());
      });
  }

  addBrand(brand: IBrand): void {
    this.selectedBrands.push(brand);
    this.brandSearch = '';
    this.showBrandDropdown = false;
    this.cdr.markForCheck();
  }

  removeBrand(brand: IBrand): void {
    this.selectedBrands = this.selectedBrands.filter(b => b.id !== brand.id);
    this.cdr.markForCheck();
  }

  // --- Image helpers ---
  getProductImage(product: IProduct): string {
    const img = product.images?.[0] || product.swiperImages?.[0] || product.mainImages?.[0];
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return `${API_CONFIG.uploadsUrl}/${img}`;
  }

  getBrandImage(brand: IBrand): string {
    if (!brand.image) return '';
    return brand.image.startsWith('http') ? brand.image : `${API_CONFIG.uploadsUrl}/${brand.image}`;
  }

  // --- Save ---
  onSave(): void {
    this.isSaving = true;
    const fd = new FormData();

    if (this.logoFile)     fd.append('logo',     this.logoFile);
    if (this.logoArFile)   fd.append('logoAr',   this.logoArFile);
    if (this.logoEnFile)   fd.append('logoEn',   this.logoEnFile);
    if (this.logoIconFile) fd.append('logoIcon', this.logoIconFile);

    fd.append('colors', JSON.stringify(this.settings.colors));
    fd.append('social', JSON.stringify(this.settings.social));
    fd.append('bestSellingProducts', JSON.stringify(this.selectedProducts.map(p => p.id)));
    fd.append('bestSellingBrands', JSON.stringify(this.selectedBrands.map(b => b.id)));
    fd.append('naturalProducts', JSON.stringify(this.naturalProducts.filter(i => i.video || i.link)));

    this.settingsService.updateSettings(fd).subscribe({
      next: () => {
        this.logoFile = null;
        this.logoArFile = null;
        this.logoEnFile = null;
        this.logoIconFile = null;
        this.isSaving = false;
        Swal.fire({ title: 'تم حفظ الإعدادات بنجاح!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.loadAll();
      },
      error: () => {
        this.isSaving = false;
        Swal.fire('خطأ', 'فشل حفظ الإعدادات', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Dropdown blur handling ---
  onProductBlur(): void {
    setTimeout(() => {
      this.showProductDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }

  onBrandBlur(): void {
    setTimeout(() => {
      this.showBrandDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }

  // ─── Backup / Restore ───

  downloadBackup(): void {
    this.backupService.downloadJson(this.settings, 'settings_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<ISiteSettings>();
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات إعدادات صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع الإعدادات',
        text: 'سيتم استبدال الإعدادات الحالية بالبيانات من الملف. هل تريد المتابعة؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، استرجع',
        cancelButtonText: 'إلغاء',
      });
      if (!confirm.isConfirmed) return;

      const fd = new FormData();
      if (data.colors) fd.append('colors', JSON.stringify(data.colors));
      if (data.social) fd.append('social', JSON.stringify(data.social));
      if (data.bestSellingProducts) fd.append('bestSellingProducts', JSON.stringify(data.bestSellingProducts));
      if (data.bestSellingBrands) fd.append('bestSellingBrands', JSON.stringify(data.bestSellingBrands));

      this.settingsService.updateSettings(fd).subscribe({
        next: () => {
          Swal.fire('تم الاسترجاع', 'تم استرجاع الإعدادات بنجاح', 'success');
          this.loadAll();
        },
        error: () => {
          Swal.fire('خطأ', 'فشل استرجاع الإعدادات', 'error');
        }
      });
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
