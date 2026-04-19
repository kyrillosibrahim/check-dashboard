import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../../../../core/services/brand.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { IBrand } from '../../../../core/models/brand.model';
import { BackupService } from '../../../../core/services/backup.service';
import { PasteImageDirective } from '../../../../core/directives/paste-image.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-brand-manage',
  imports: [FormsModule, PasteImageDirective],
  templateUrl: './brand-manage.component.html',
  styleUrl: './brand-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandManageComponent implements OnInit {
  private brandService = inject(BrandService);
  private cloudinaryService = inject(CloudinaryService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  brands: IBrand[] = [];
  brandName = '';
  brandLink = '';
  imagePreview: string | null = null;
  selectedImageUrl: string | null = null;
  isUploadingImage = false;
  editingBrand: IBrand | null = null;
  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading = true;
    this.error = '';
    this.brandService.getAll().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل العلامات التجارية. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await this.processImageFile(file);
  }

  async onPastedImage(file: File): Promise<void> {
    await this.processImageFile(file);
  }

  private async processImageFile(file: File): Promise<void> {
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    this.isUploadingImage = true;
    this.cdr.markForCheck();
    try {
      this.selectedImageUrl = await this.cloudinaryService.uploadImage(file, 'brands');
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

  onSave(): void {
    const name = this.brandName.trim();
    if (!name) return;

    this.isSaving = true;
    const fd = new FormData();
    fd.append('name', name);
    fd.append('link', this.brandLink.trim());
    if (this.selectedImageUrl) {
      fd.append('imageUrl', this.selectedImageUrl);
    }

    if (this.editingBrand) {
      this.brandService.update(this.editingBrand.id, fd).subscribe({
        next: (updated) => {
          // Patch image locally in case backend doesn't return Cloudinary URL
          if (this.selectedImageUrl) {
            const idx = this.brands.findIndex(b => b.id === updated.id);
            if (idx !== -1) this.brands[idx] = { ...this.brands[idx], ...updated, image: this.selectedImageUrl };
          }
          Swal.fire({ title: 'تم تحديث العلامة التجارية!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadBrands();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.brandService.create(fd).subscribe({
        next: () => {
          Swal.fire({ title: 'تم إضافة العلامة التجارية!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadBrands();
        },
        error: (err) => {
          if (err?.status === 409) {
            Swal.fire('خطأ', 'هذه العلامة التجارية موجودة بالفعل!', 'error');
          } else {
            Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
          }
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onEdit(brand: IBrand): void {
    this.editingBrand = brand;
    this.brandName = brand.name;
    this.brandLink = brand.link || '';
    this.selectedImageUrl = brand.image || null;
    this.imagePreview = brand.image || null;
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.resetForm();
  }

  async onDelete(brand: IBrand): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف علامة "${brand.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفها!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.brandService.delete(brand.id).subscribe({
        next: () => {
          Swal.fire('تم حذف العلامة التجارية!', '', 'success');
          this.loadBrands();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  getImageUrl(brand: IBrand): string {
    return brand.image || '';
  }

  private resetForm(): void {
    this.brandName = '';
    this.brandLink = '';
    this.selectedImageUrl = null;
    this.imagePreview = null;
    this.editingBrand = null;
    this.isSaving = false;
    this.cdr.markForCheck();
  }

  // ─── Backup / Restore ───

  async downloadBackup(): Promise<void> {
    if (!this.brands.length) {
      Swal.fire('تنبيه', 'لا توجد علامات تجارية لتحميلها', 'warning');
      return;
    }
    this.backupService.downloadJson(this.brands, 'brands_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<(IBrand & { imageBase64?: string })[]>();
      if (!Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات علامات تجارية صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم رفع <b>${data.length}</b> علامة تجارية من الملف.<br>هل تريد المتابعة؟`,
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
        const brand = data[i];
        try {
          const fd = new FormData();
          fd.append('name', brand.name);
          if (brand.link) fd.append('link', brand.link);

          // Upload to Cloudinary if base64, otherwise use existing URL
          if (brand.imageBase64) {
            const file = this.backupService.base64ToFile(brand.imageBase64, brand.name);
            if (file) {
              const url = await this.cloudinaryService.uploadImage(file, 'brands');
              fd.append('imageUrl', url);
            }
          } else if (brand.image?.startsWith('http')) {
            fd.append('imageUrl', brand.image);
          }

          await new Promise<void>((resolve) => {
            this.brandService.update(brand.id, fd).subscribe({
              next: () => { success++; resolve(); },
              error: () => {
                this.brandService.create(fd).subscribe({
                  next: () => { success++; resolve(); },
                  error: () => { failed++; resolve(); }
                });
              }
            });
          });
        } catch {
          failed++;
        }
        Swal.update({ html: `${i + 1} / ${data.length}` });
      }
      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}`, success > 0 ? 'success' : 'error');
      this.loadBrands();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
