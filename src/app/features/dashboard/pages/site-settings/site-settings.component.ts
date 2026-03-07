import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-site-settings',
  imports: [FormsModule],
  templateUrl: './site-settings.component.html',
  styleUrl: './site-settings.component.scss'
})
export class SiteSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private brandService = inject(BrandService);
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);

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
          this.logoPreview = `${API_CONFIG.uploadsUrl}/${s.logo}`;
        }
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
        this.selectedProducts = products.filter(p => this.settings.bestSellingProducts.includes(p.id));
        this.checkLoaded();
      },
      error: () => this.checkLoaded()
    });
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
    if (input.files && input.files[0]) {
      this.logoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.logoFile);
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
    return `${API_CONFIG.uploadsUrl}/${brand.image}`;
  }

  // --- Save ---
  onSave(): void {
    this.isSaving = true;
    const fd = new FormData();

    if (this.logoFile) {
      fd.append('logo', this.logoFile);
    }

    fd.append('colors', JSON.stringify(this.settings.colors));
    fd.append('social', JSON.stringify(this.settings.social));
    fd.append('bestSellingProducts', JSON.stringify(this.selectedProducts.map(p => p.id)));
    fd.append('bestSellingBrands', JSON.stringify(this.selectedBrands.map(b => b.id)));

    this.settingsService.updateSettings(fd).subscribe({
      next: (updated) => {
        this.settings = updated;
        this.logoFile = null;
        if (updated.logo) {
          this.logoPreview = `${API_CONFIG.uploadsUrl}/${updated.logo}`;
        }
        this.isSaving = false;
        Swal.fire({ title: 'تم حفظ الإعدادات بنجاح!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.cdr.markForCheck();
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
}
