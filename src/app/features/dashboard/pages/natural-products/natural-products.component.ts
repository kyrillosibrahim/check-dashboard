import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../../core/services/settings.service';
import { ProductService } from '../../../../core/services/product.service';
import { BrandService } from '../../../../core/services/brand.service';
import { IProduct } from '../../../../core/models/product.model';
import { IBrand } from '../../../../core/models/brand.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { PasteImageDirective } from '../../../../core/directives/paste-image.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-natural-products',
  imports: [FormsModule, PasteImageDirective],
  templateUrl: './natural-products.component.html',
  styleUrl: './natural-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NaturalProductsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private brandService = inject(BrandService);
  private cdr = inject(ChangeDetectorRef);
  private cloudinaryService = inject(CloudinaryService);

  // Natural products (videos with links)
  naturalProducts: { video: string; link: string }[] = [];
  uploadingVideoIndex: number | null = null;

  // Per-row state for the natural-products picker
  naturalProductSelected: (IProduct | null)[] = [];
  naturalBrandSelected: (IBrand | null)[] = [];
  naturalLinkType: ('product' | 'brand')[] = [];
  naturalSearch: string[] = [];
  naturalBrandSearch: string[] = [];
  naturalDropdownIndex: number | null = null;

  // Drag & drop reordering state
  dragArmedIndex: number | null = null;
  dragFromIndex: number | null = null;
  dragOverIndex: number | null = null;

  // All products & brands for selection
  allProducts: IProduct[] = [];
  allBrands: IBrand[] = [];

  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.error = '';

    this.settingsService.getSettings().subscribe({
      next: (s) => {
        this.naturalProducts = (s.naturalProducts || []).map(i => ({ video: i.video || '', link: i.link || '' }));
        this.hydrateNaturalSelection();
        this.loadProducts();
        this.loadBrands();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل البيانات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.hydrateNaturalSelection();
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private loadBrands(): void {
    this.brandService.getAll().subscribe({
      next: (brands) => {
        this.allBrands = brands;
        this.hydrateNaturalSelection();
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  /** Resolve link strings back to product/brand objects for display */
  private hydrateNaturalSelection(): void {
    this.naturalLinkType = this.naturalProducts.map(item =>
      item.link?.includes('/products?brand=') ? 'brand' : 'product'
    );
    this.naturalProductSelected = this.naturalProducts.map(item => {
      if (item.link?.includes('/products?brand=')) return null;
      const id = this.extractProductId(item.link);
      return id ? this.allProducts.find(p => p.id === id) || null : null;
    });
    this.naturalBrandSelected = this.naturalProducts.map(item => {
      if (!item.link?.includes('/products?brand=')) return null;
      const name = new URLSearchParams(item.link.split('?')[1] || '').get('brand');
      return name ? this.allBrands.find(b => b.name === name) || null : null;
    });
    this.naturalSearch = this.naturalProducts.map(() => '');
    this.naturalBrandSearch = this.naturalProducts.map(() => '');
  }

  private extractProductId(link: string): string | null {
    if (!link) return null;
    const match = link.match(/\/product\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // --- Natural Products (videos with links) ---
  addNaturalProduct(): void {
    this.naturalProducts = [...this.naturalProducts, { video: '', link: '' }];
    this.naturalProductSelected = [...this.naturalProductSelected, null];
    this.naturalBrandSelected = [...this.naturalBrandSelected, null];
    this.naturalLinkType = [...this.naturalLinkType, 'product'];
    this.naturalSearch = [...this.naturalSearch, ''];
    this.naturalBrandSearch = [...this.naturalBrandSearch, ''];
    this.cdr.markForCheck();
  }

  removeNaturalProduct(index: number): void {
    this.naturalProducts = this.naturalProducts.filter((_, i) => i !== index);
    this.naturalProductSelected = this.naturalProductSelected.filter((_, i) => i !== index);
    this.naturalBrandSelected = this.naturalBrandSelected.filter((_, i) => i !== index);
    this.naturalLinkType = this.naturalLinkType.filter((_, i) => i !== index);
    this.naturalSearch = this.naturalSearch.filter((_, i) => i !== index);
    this.naturalBrandSearch = this.naturalBrandSearch.filter((_, i) => i !== index);
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

  filteredNaturalBrands(index: number): IBrand[] {
    const term = (this.naturalBrandSearch[index] || '').trim().toLowerCase();
    const list = term
      ? this.allBrands.filter(b => b.name?.toLowerCase().includes(term))
      : this.allBrands;
    return list.slice(0, 30);
  }

  selectNaturalBrand(index: number, brand: IBrand): void {
    this.naturalBrandSelected[index] = brand;
    this.naturalProducts[index] = { ...this.naturalProducts[index], link: `/products?brand=${brand.name}` };
    this.naturalBrandSearch[index] = '';
    this.naturalDropdownIndex = null;
    this.cdr.markForCheck();
  }

  clearNaturalBrand(index: number): void {
    this.naturalBrandSelected[index] = null;
    this.naturalProducts[index] = { ...this.naturalProducts[index], link: '' };
    this.cdr.markForCheck();
  }

  setNaturalLinkType(index: number, type: 'product' | 'brand'): void {
    if (this.naturalLinkType[index] === type) return;
    this.naturalLinkType[index] = type;
    this.naturalProductSelected[index] = null;
    this.naturalBrandSelected[index] = null;
    this.naturalProducts[index] = { ...this.naturalProducts[index], link: '' };
    this.naturalSearch[index] = '';
    this.naturalBrandSearch[index] = '';
    this.naturalDropdownIndex = null;
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

  // --- Reordering ---
  /** Move a row, keeping all parallel per-row arrays in sync */
  moveNatural(from: number, to: number): void {
    const len = this.naturalProducts.length;
    if (from === to || from < 0 || to < 0 || from >= len || to >= len) return;
    if (this.uploadingVideoIndex !== null) return;
    const move = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    };
    this.naturalProducts = move(this.naturalProducts);
    this.naturalProductSelected = move(this.naturalProductSelected);
    this.naturalBrandSelected = move(this.naturalBrandSelected);
    this.naturalLinkType = move(this.naturalLinkType);
    this.naturalSearch = move(this.naturalSearch);
    this.naturalBrandSearch = move(this.naturalBrandSearch);
    this.naturalDropdownIndex = null;
    this.cdr.markForCheck();
  }

  /** Rows are only draggable from the handle, so inputs inside stay usable */
  armNaturalDrag(index: number): void {
    this.dragArmedIndex = this.uploadingVideoIndex === null ? index : null;
  }

  onNaturalDragStart(event: DragEvent, index: number): void {
    if (this.dragArmedIndex !== index) {
      event.preventDefault();
      return;
    }
    this.dragFromIndex = index;
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onNaturalDragOver(event: DragEvent, index: number): void {
    if (this.dragFromIndex === null) return;
    event.preventDefault();
    if (this.dragOverIndex !== index) {
      this.dragOverIndex = index;
      this.cdr.markForCheck();
    }
  }

  onNaturalDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.dragFromIndex !== null) this.moveNatural(this.dragFromIndex, index);
    this.onNaturalDragEnd();
  }

  onNaturalDragEnd(): void {
    this.dragArmedIndex = null;
    this.dragFromIndex = null;
    this.dragOverIndex = null;
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
    fd.append('naturalProducts', JSON.stringify(this.naturalProducts.filter(i => i.video || i.link)));

    this.settingsService.updateSettings(fd).subscribe({
      next: () => {
        this.isSaving = false;
        Swal.fire({ title: 'تم الحفظ بنجاح!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.loadAll();
      },
      error: () => {
        this.isSaving = false;
        Swal.fire('خطأ', 'فشل الحفظ', 'error');
        this.cdr.markForCheck();
      }
    });
  }
}
