import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ICategory, ISubcategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-manage',
  imports: [FormsModule],
  templateUrl: './category-manage.component.html',
  styleUrl: './category-manage.component.scss'
})
export class CategoryManageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cdr = inject(ChangeDetectorRef);

  categories: ICategory[] = [];
  allBrands: IBrand[] = [];
  isLoading = true;
  error = '';

  // ─── Category form ───
  categoryName = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  editingCategory: ICategory | null = null;
  isSaving = false;

  // ─── Expanded category (detail panel) ───
  expandedCategoryId: number | null = null;

  // ─── Subcategory form ───
  subName = '';
  subImage: File | null = null;
  subImagePreview: string | null = null;
  editingSub: ISubcategory | null = null;
  isSavingSub = false;

  // ─── Famous brands selection ───
  brandSearch = '';
  showBrandDropdown = false;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.error = '';
    this.categoryService.getDetailed().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.loadBrands();
      },
      error: () => {
        this.error = 'فشل تحميل الأقسام. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadBrands(): void {
    this.brandService.getAll().subscribe({
      next: (brands) => {
        this.allBrands = brands;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return API_CONFIG.baseUrl + image;
  }

  getBrandImageUrl(brand: IBrand): string {
    if (!brand.image) return '';
    if (brand.image.startsWith('http')) return brand.image;
    return `${API_CONFIG.uploadsUrl}/${brand.image}`;
  }

  // ─── Category CRUD ───

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.cdr.markForCheck();
  }

  onSave(): void {
    const name = this.categoryName.trim();
    if (!name) return;
    this.isSaving = true;

    if (this.editingCategory) {
      this.categoryService.update(this.editingCategory.id, name, this.selectedImage || undefined).subscribe({
        next: () => {
          Swal.fire({ title: 'تم تحديث القسم!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadAll();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.categoryService.create(name, this.selectedImage || undefined).subscribe({
        next: () => {
          Swal.fire({ title: 'تم إضافة القسم!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadAll();
        },
        error: (err) => {
          if (err?.status === 409) {
            Swal.fire('خطأ', 'هذا القسم موجود بالفعل!', 'error');
          } else {
            Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
          }
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onEdit(cat: ICategory): void {
    this.editingCategory = cat;
    this.categoryName = cat.name;
    this.selectedImage = null;
    this.imagePreview = cat.image ? this.getImageUrl(cat.image) : null;
    // Also expand the detail panel to show subcategories & brands
    this.expandedCategoryId = cat.id;
    this.resetSubForm();
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.resetForm();
  }

  async onDelete(cat: ICategory): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف قسم "${cat.name}" وكل الأقسام الفرعية؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.categoryService.delete(cat.id).subscribe({
        next: () => {
          Swal.fire('تم حذف القسم!', '', 'success');
          if (this.expandedCategoryId === cat.id) this.expandedCategoryId = null;
          this.loadAll();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  private resetForm(): void {
    this.categoryName = '';
    this.selectedImage = null;
    this.imagePreview = null;
    this.editingCategory = null;
    this.isSaving = false;
    this.cdr.markForCheck();
  }

  // ─── Expand / Collapse ───

  toggleExpand(cat: ICategory): void {
    if (this.expandedCategoryId === cat.id) {
      this.expandedCategoryId = null;
    } else {
      this.expandedCategoryId = cat.id;
      this.resetSubForm();
    }
    this.cdr.markForCheck();
  }

  get expandedCategory(): ICategory | null {
    if (!this.expandedCategoryId) return null;
    return this.categories.find(c => c.id === this.expandedCategoryId) || null;
  }

  // ─── Subcategory CRUD ───

  onSubImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.subImage = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.subImagePreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeSubImage(): void {
    this.subImage = null;
    this.subImagePreview = null;
    this.cdr.markForCheck();
  }

  onSaveSub(): void {
    const name = this.subName.trim();
    if (!name || !this.expandedCategoryId) return;
    this.isSavingSub = true;

    if (this.editingSub) {
      this.categoryService.updateSubcategory(
        this.expandedCategoryId, this.editingSub.id, name, this.subImage || undefined
      ).subscribe({
        next: (updatedCat) => {
          this.updateCategoryInList(updatedCat);
          Swal.fire({ title: 'تم تحديث القسم الفرعى!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetSubForm();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
          this.isSavingSub = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.categoryService.addSubcategory(
        this.expandedCategoryId, name, this.subImage || undefined
      ).subscribe({
        next: (updatedCat) => {
          this.updateCategoryInList(updatedCat);
          Swal.fire({ title: 'تم إضافة القسم الفرعى!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetSubForm();
        },
        error: (err) => {
          if (err?.status === 409) {
            Swal.fire('خطأ', 'القسم الفرعى موجود بالفعل!', 'error');
          } else {
            Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
          }
          this.isSavingSub = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onEditSub(sub: ISubcategory): void {
    this.editingSub = sub;
    this.subName = sub.name;
    this.subImage = null;
    this.subImagePreview = sub.image ? this.getImageUrl(sub.image) : null;
    this.cdr.markForCheck();
  }

  async onDeleteSub(sub: ISubcategory): Promise<void> {
    if (!this.expandedCategoryId) return;
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف "${sub.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.categoryService.deleteSubcategory(this.expandedCategoryId, sub.id).subscribe({
        next: (updatedCat) => {
          this.updateCategoryInList(updatedCat);
          Swal.fire({ title: 'تم الحذف!', icon: 'success', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  onCancelSubEdit(): void {
    this.resetSubForm();
  }

  private resetSubForm(): void {
    this.subName = '';
    this.subImage = null;
    this.subImagePreview = null;
    this.editingSub = null;
    this.isSavingSub = false;
    this.cdr.markForCheck();
  }

  private updateCategoryInList(updatedCat: ICategory): void {
    const idx = this.categories.findIndex(c => c.id === updatedCat.id);
    if (idx !== -1) {
      this.categories[idx] = { ...this.categories[idx], ...updatedCat };
    }
    this.cdr.markForCheck();
  }

  // ─── Famous Brands ───

  getSelectedBrands(cat: ICategory): IBrand[] {
    // From detailed API, famousBrandsData has populated brand objects
    if (cat.famousBrandsData?.length) return cat.famousBrandsData;
    // Fallback: resolve from IDs
    return (cat.famousBrands || [])
      .map(id => this.allBrands.find(b => b.id === id))
      .filter((b): b is IBrand => !!b);
  }

  getAvailableBrands(cat: ICategory): IBrand[] {
    const selectedIds = (cat.famousBrands || []);
    return this.allBrands
      .filter(b => !selectedIds.includes(b.id))
      .filter(b => {
        if (!this.brandSearch.trim()) return true;
        return b.name.toLowerCase().includes(this.brandSearch.toLowerCase());
      });
  }

  addBrandToCategory(cat: ICategory, brand: IBrand): void {
    if (!cat.famousBrands) cat.famousBrands = [];
    cat.famousBrands.push(brand.id);
    this.brandSearch = '';
    this.showBrandDropdown = false;
    this.saveBrands(cat);
  }

  removeBrandFromCategory(cat: ICategory, brand: IBrand): void {
    cat.famousBrands = (cat.famousBrands || []).filter(id => id !== brand.id);
    this.saveBrands(cat);
  }

  private saveBrands(cat: ICategory): void {
    this.categoryService.update(cat.id, cat.name, undefined, cat.famousBrands).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        Swal.fire('خطأ', 'فشل حفظ العلامات التجارية', 'error');
      }
    });
  }

  onBrandBlur(): void {
    setTimeout(() => {
      this.showBrandDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }
}
