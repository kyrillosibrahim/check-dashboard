import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../core/services/category.service';
import { BrandService } from '../../../../core/services/brand.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ICategory, ISubcategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
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
  private cloudinaryService = inject(CloudinaryService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  categories: ICategory[] = [];
  allBrands: IBrand[] = [];
  isLoading = true;
  error = '';

  // ─── Category form ───
  categoryName = '';
  imagePreview: string | null = null;
  selectedImageUrl: string | null = null;
  isUploadingImage = false;
  editingCategory: ICategory | null = null;
  isSaving = false;

  // ─── Expanded category (detail panel) ───
  expandedCategoryId: number | null = null;

  // ─── Subcategory form ───
  subName = '';
  subImagePreview: string | null = null;
  selectedSubImageUrl: string | null = null;
  isUploadingSubImage = false;
  editingSub: ISubcategory | null = null;
  isSavingSub = false;

  // ─── Famous brands selection ───
  brandSearch = '';
  showBrandDropdown = false;

  // ─── Filter tags ───
  newFilterTag = '';
  dragTagIndex = -1;
  dragOverTagIndex = -1;

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
    return image;
  }

  getBrandImageUrl(brand: IBrand): string {
    if (!brand.image) return '';
    return brand.image;
  }

  // ─── Category image upload ───

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    this.isUploadingImage = true;
    this.cdr.markForCheck();
    try {
      this.selectedImageUrl = await this.cloudinaryService.uploadImage(file, 'categories');
      this.imagePreview = this.selectedImageUrl;
    } catch {
      Swal.fire('خطأ', 'فشل رفع الصورة على Cloudinary', 'error');
      this.selectedImageUrl = null;
      this.imagePreview = null;
    } finally {
      this.isUploadingImage = false;
      this.cdr.markForCheck();
    }
  }

  removeImage(): void {
    this.selectedImageUrl = null;
    this.imagePreview = null;
    this.cdr.markForCheck();
  }

  // ─── Category CRUD ───

  onSave(): void {
    const name = this.categoryName.trim();
    if (!name) return;
    this.isSaving = true;

    if (this.editingCategory) {
      this.categoryService.update(this.editingCategory.id, name, this.selectedImageUrl || undefined).subscribe({
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
      this.categoryService.create(name, this.selectedImageUrl || undefined).subscribe({
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
    this.selectedImageUrl = cat.image || null;
    this.imagePreview = cat.image || null;
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
    this.selectedImageUrl = null;
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

  // ─── Subcategory image upload ───

  async onSubImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.subImagePreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    this.isUploadingSubImage = true;
    this.cdr.markForCheck();
    try {
      this.selectedSubImageUrl = await this.cloudinaryService.uploadImage(file, 'categories/subcategories');
      this.subImagePreview = this.selectedSubImageUrl;
    } catch {
      Swal.fire('خطأ', 'فشل رفع الصورة على Cloudinary', 'error');
      this.selectedSubImageUrl = null;
      this.subImagePreview = null;
    } finally {
      this.isUploadingSubImage = false;
      this.cdr.markForCheck();
    }
  }

  removeSubImage(): void {
    this.selectedSubImageUrl = null;
    this.subImagePreview = null;
    this.cdr.markForCheck();
  }

  // ─── Subcategory CRUD ───

  onSaveSub(): void {
    const name = this.subName.trim();
    if (!name || !this.expandedCategoryId) return;
    this.isSavingSub = true;

    if (this.editingSub) {
      const subId = this.editingSub.id;
      const imageUrl = this.selectedSubImageUrl || undefined;
      this.categoryService.updateSubcategory(
        this.expandedCategoryId, subId, name, imageUrl
      ).subscribe({
        next: (updatedCat) => {
          this.updateCategoryInList(updatedCat, subId, imageUrl);
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
      const imageUrl = this.selectedSubImageUrl || undefined;
      this.categoryService.addSubcategory(
        this.expandedCategoryId, name, imageUrl
      ).subscribe({
        next: (updatedCat) => {
          // For new subcategory, find it by name and patch the image
          const newSub = updatedCat.subcategories?.find(s => s.name === name);
          this.updateCategoryInList(updatedCat, newSub?.id, imageUrl);
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
    this.selectedSubImageUrl = sub.image || null;
    this.subImagePreview = sub.image || null;
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
    this.selectedSubImageUrl = null;
    this.subImagePreview = null;
    this.editingSub = null;
    this.isSavingSub = false;
    this.cdr.markForCheck();
  }

  private updateCategoryInList(updatedCat: ICategory, subId?: number, subImageUrl?: string): void {
    const idx = this.categories.findIndex(c => c.id === updatedCat.id);
    if (idx !== -1) {
      const merged = { ...this.categories[idx], ...updatedCat };
      // If backend didn't return Cloudinary URL, patch it manually
      if (subId && subImageUrl && merged.subcategories) {
        merged.subcategories = merged.subcategories.map(s =>
          s.id === subId ? { ...s, image: subImageUrl } : s
        );
      }
      this.categories[idx] = merged;
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
      next: () => { this.cdr.markForCheck(); },
      error: () => { Swal.fire('خطأ', 'فشل حفظ العلامات التجارية', 'error'); }
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
      next: () => { this.cdr.markForCheck(); },
      error: () => { Swal.fire('خطأ', 'فشل حفظ كلمات الفلتر', 'error'); }
    });
  }

  // ─── Filter tag drag & drop ───

  onTagDragStart(event: DragEvent, index: number): void {
    this.dragTagIndex = index;
    event.dataTransfer?.setData('text/plain', String(index));
  }

  onTagDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.dragOverTagIndex !== index) {
      this.dragOverTagIndex = index;
      this.cdr.markForCheck();
    }
  }

  onTagDragLeave(): void {
    this.dragOverTagIndex = -1;
    this.cdr.markForCheck();
  }

  onTagDrop(event: DragEvent, cat: ICategory, targetIndex: number): void {
    event.preventDefault();
    const from = this.dragTagIndex;
    this.dragTagIndex = -1;
    this.dragOverTagIndex = -1;
    if (from === -1 || from === targetIndex) { this.cdr.markForCheck(); return; }
    const tags = [...(cat.filterTags || [])];
    const [moved] = tags.splice(from, 1);
    tags.splice(targetIndex, 0, moved);
    cat.filterTags = tags;
    this.saveFilterTags(cat);
    this.cdr.markForCheck();
  }

  onTagDragEnd(): void {
    this.dragTagIndex = -1;
    this.dragOverTagIndex = -1;
    this.cdr.markForCheck();
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
    const brandIds = (cat: ICategory) => (cat.famousBrands || []).map((b: any) => typeof b === 'object' ? b.id : b);
    const data = this.categories.map(cat => ({ ...cat, famousBrands: brandIds(cat) }));
    this.backupService.downloadJson(data, 'categories_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
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
          // Upload category image to Cloudinary if base64
          let catImageUrl = cat.image || undefined;
          if (cat.imageBase64) {
            const file = this.backupService.base64ToFile(cat.imageBase64, cat.name);
            if (file) catImageUrl = await this.cloudinaryService.uploadImage(file, 'categories');
          }

          const brandIds = (cat.famousBrands || []).map((b: any) => typeof b === 'object' ? b.id : b).filter((id: any) => id != null);

          await new Promise<void>((resolve) => {
            this.categoryService.update(cat.id, cat.name, catImageUrl, brandIds.length ? brandIds : undefined, cat.filterTags?.length ? cat.filterTags : undefined).subscribe({
              next: () => { success++; resolve(); },
              error: () => {
                this.categoryService.create(cat.name, catImageUrl).subscribe({
                  next: () => { success++; resolve(); },
                  error: () => { failed++; resolve(); }
                });
              }
            });
          });

          // Restore subcategories
          for (const sub of (cat.subcategories || [])) {
            let subImageUrl = sub.image || undefined;
            if (sub.imageBase64) {
              const subFile = this.backupService.base64ToFile(sub.imageBase64, sub.name);
              if (subFile) subImageUrl = await this.cloudinaryService.uploadImage(subFile, 'categories/subcategories');
            }
            try {
              await new Promise<void>((resolve) => {
                this.categoryService.updateSubcategory(cat.id, sub.id, sub.name, subImageUrl).subscribe({
                  next: () => resolve(),
                  error: () => {
                    this.categoryService.addSubcategory(cat.id, sub.name, subImageUrl).subscribe({
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
