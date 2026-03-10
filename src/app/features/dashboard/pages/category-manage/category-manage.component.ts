import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ICategory, ISubcategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import { BackupService } from '../../../../core/services/backup.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-manage',
  imports: [FormsModule],
  templateUrl: './category-manage.component.html',
  styleUrl: './category-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryManageComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

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

  // ─── Filter tags ───
  newFilterTag = '';

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

  private normalizeBrandId(entry: any): number {
    return typeof entry === 'object' && entry !== null ? entry.id : entry;
  }

  getSelectedBrands(cat: ICategory): IBrand[] {
    if (this.allBrands.length > 0 && cat.famousBrands?.length) {
      return (cat.famousBrands)
        .map(entry => this.allBrands.find(b => b.id === this.normalizeBrandId(entry)))
        .filter((b): b is IBrand => !!b);
    }
    if (cat.famousBrandsData?.length) return cat.famousBrandsData;
    return [];
  }

  getAvailableBrands(cat: ICategory): IBrand[] {
    const selectedIds = (cat.famousBrands || []).map(entry => this.normalizeBrandId(entry));
    return this.allBrands
      .filter(b => !selectedIds.includes(b.id))
      .filter(b => {
        if (!this.brandSearch.trim()) return true;
        return b.name.toLowerCase().includes(this.brandSearch.toLowerCase());
      });
  }

  addBrandToCategory(cat: ICategory, brand: IBrand): void {
    if (!cat.famousBrands) cat.famousBrands = [];
    if (!cat.famousBrandsData) cat.famousBrandsData = [];
    cat.famousBrands.push(brand.id);
    cat.famousBrandsData.push(brand);
    this.brandSearch = '';
    this.showBrandDropdown = false;
    this.saveBrands(cat);
  }

  removeBrandFromCategory(cat: ICategory, brand: IBrand): void {
    cat.famousBrands = (cat.famousBrands || []).filter(entry => this.normalizeBrandId(entry) !== brand.id);
    cat.famousBrandsData = (cat.famousBrandsData || []).filter(b => b.id !== brand.id);
    this.saveBrands(cat);
  }

  private saveBrands(cat: ICategory): void {
    const brandIds = (cat.famousBrands || []).map(entry => this.normalizeBrandId(entry));
    this.categoryService.update(cat.id, cat.name, undefined, brandIds).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        Swal.fire('خطأ', 'فشل حفظ العلامات التجارية', 'error');
      }
    });
  }

  // ─── Filter Tags ───

  addFilterTag(cat: ICategory): void {
    const tag = this.newFilterTag.trim();
    if (!tag) return;
    if (!cat.filterTags) cat.filterTags = [];
    if (cat.filterTags.includes(tag)) {
      Swal.fire('تنبيه', 'هذه الكلمة موجودة بالفعل!', 'warning');
      return;
    }
    cat.filterTags.push(tag);
    this.newFilterTag = '';
    this.saveFilterTags(cat);
  }

  removeFilterTag(cat: ICategory, tag: string): void {
    cat.filterTags = (cat.filterTags || []).filter(t => t !== tag);
    this.saveFilterTags(cat);
  }

  private saveFilterTags(cat: ICategory): void {
    this.categoryService.update(cat.id, cat.name, undefined, undefined, cat.filterTags).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        Swal.fire('خطأ', 'فشل حفظ كلمات الفلتر', 'error');
      }
    });
  }

  onBrandBlur(): void {
    setTimeout(() => {
      this.showBrandDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }

  // ─── Backup / Restore ───

  async downloadBackup(): Promise<void> {
    if (!this.categories.length) {
      Swal.fire('تنبيه', 'لا توجد أقسام لتحميلها', 'warning');
      return;
    }

    Swal.fire({ title: 'جاري تجهيز النسخة الاحتياطية...', html: '0 / ' + this.categories.length, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const catsWithImages = [];
    let imgOk = 0;
    let imgTotal = 0;
    for (let i = 0; i < this.categories.length; i++) {
      const cat = this.categories[i];
      const imageUrl = cat.image ? this.getImageUrl(cat.image) : '';
      let imageBase64 = '';
      if (imageUrl) {
        imgTotal++;
        imageBase64 = await this.backupService.imageToBase64(imageUrl);
        if (imageBase64) imgOk++;
      }

      const subsWithImages = [];
      for (const sub of (cat.subcategories || [])) {
        const subImageUrl = sub.image ? this.getImageUrl(sub.image) : '';
        let subImageBase64 = '';
        if (subImageUrl) {
          imgTotal++;
          subImageBase64 = await this.backupService.imageToBase64(subImageUrl);
          if (subImageBase64) imgOk++;
        }
        subsWithImages.push({ ...sub, imageBase64: subImageBase64 });
      }

      // Normalize famousBrands to IDs (API detailed returns full objects)
      const brandIds = (cat.famousBrands || []).map((b: any) => typeof b === 'object' ? b.id : b);

      catsWithImages.push({ ...cat, imageBase64, subcategories: subsWithImages, famousBrands: brandIds });
      Swal.update({ html: `${i + 1} / ${this.categories.length}` });
    }

    this.backupService.downloadJson(catsWithImages, 'categories_backup');

    if (imgTotal > 0 && imgOk < imgTotal) {
      Swal.fire({ title: 'تم التحميل', html: `تم حفظ <b>${imgOk}</b> صورة من <b>${imgTotal}</b><br>بعض الصور لم يتم تحميلها`, icon: 'warning' });
    } else {
      Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', html: `تم حفظ <b>${imgOk}</b> صورة من <b>${imgTotal}</b>`, icon: 'success', timer: 2000, showConfirmButton: false });
    }
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<(ICategory & { imageBase64?: string; subcategories?: (ISubcategory & { imageBase64?: string })[] })[]>();
      if (!Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات أقسام صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم رفع <b>${data.length}</b> قسم من الملف.<br>هل تريد المتابعة؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، استرجع',
        cancelButtonText: 'إلغاء',
      });
      if (!confirm.isConfirmed) return;

      Swal.fire({ title: 'جاري الاسترجاع...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      let success = 0;
      let failed = 0;
      for (const cat of data) {
        try {
          const imageFile = cat.imageBase64 ? this.backupService.base64ToFile(cat.imageBase64, cat.name) : null;

          // Normalize famousBrands to IDs (backup might have full objects)
          const brandIds = (cat.famousBrands || []).map((b: any) => typeof b === 'object' ? b.id : b).filter((id: any) => id != null);

          await new Promise<void>((resolve) => {
            this.categoryService.update(cat.id, cat.name, imageFile || undefined, brandIds.length ? brandIds : undefined, cat.filterTags?.length ? cat.filterTags : undefined).subscribe({
              next: () => { success++; resolve(); },
              error: () => {
                this.categoryService.create(cat.name, imageFile || undefined).subscribe({
                  next: () => { success++; resolve(); },
                  error: () => { failed++; resolve(); }
                });
              }
            });
          });

          // Restore subcategories
          for (const sub of (cat.subcategories || [])) {
            const subFile = sub.imageBase64 ? this.backupService.base64ToFile(sub.imageBase64, sub.name) : null;
            try {
              await new Promise<void>((resolve) => {
                this.categoryService.updateSubcategory(cat.id, sub.id, sub.name, subFile || undefined).subscribe({
                  next: () => resolve(),
                  error: () => {
                    this.categoryService.addSubcategory(cat.id, sub.name, subFile || undefined).subscribe({
                      next: () => resolve(),
                      error: () => resolve()
                    });
                  }
                });
              });
            } catch { /* skip */ }
          }
        } catch {
          failed++;
        }
      }
      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}`, success > 0 ? 'success' : 'error');
      this.loadAll();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
