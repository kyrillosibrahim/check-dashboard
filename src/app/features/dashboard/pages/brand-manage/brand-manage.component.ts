import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../../../../core/services/brand.service';
import { IBrand } from '../../../../core/models/brand.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import { BackupService } from '../../../../core/services/backup.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-brand-manage',
  imports: [FormsModule],
  templateUrl: './brand-manage.component.html',
  styleUrl: './brand-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandManageComponent implements OnInit {
  private brandService = inject(BrandService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  brands: IBrand[] = [];
  brandName = '';
  brandLink = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSave(): void {
    const name = this.brandName.trim();
    if (!name) return;

    this.isSaving = true;
    const fd = new FormData();
    fd.append('name', name);
    fd.append('link', this.brandLink.trim());
    if (this.selectedFile) {
      fd.append('image', this.selectedFile);
    }

    if (this.editingBrand) {
      this.brandService.update(this.editingBrand.id, fd).subscribe({
        next: () => {
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
    this.selectedFile = null;
    this.imagePreview = brand.image ? (brand.image.startsWith('http') ? brand.image : `${API_CONFIG.uploadsUrl}/${brand.image}`) : null;
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
    return brand.image ? (brand.image.startsWith('http') ? brand.image : `${API_CONFIG.uploadsUrl}/${brand.image}`) : '';
  }

  private resetForm(): void {
    this.brandName = '';
    this.brandLink = '';
    this.selectedFile = null;
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

    Swal.fire({ title: 'جاري تجهيز النسخة الاحتياطية...', html: '0 / ' + this.brands.length, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const brandsWithImages = [];
    let imgOk = 0;
    let imgTotal = 0;
    for (let i = 0; i < this.brands.length; i++) {
      const brand = this.brands[i];
      const imageUrl = this.getImageUrl(brand);
      let imageBase64 = '';
      if (imageUrl) {
        imgTotal++;
        imageBase64 = await this.backupService.imageToBase64(imageUrl);
        if (imageBase64) imgOk++;
      }
      brandsWithImages.push({ ...brand, imageBase64 });
      Swal.update({ html: `${i + 1} / ${this.brands.length}` });
    }

    this.backupService.downloadJson(brandsWithImages, 'brands_backup');

    if (imgTotal > 0 && imgOk < imgTotal) {
      Swal.fire({ title: 'تم التحميل', html: `تم حفظ <b>${imgOk}</b> صورة من <b>${imgTotal}</b><br>بعض الصور لم يتم تحميلها`, icon: 'warning' });
    } else {
      Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', html: `تم حفظ <b>${imgOk}</b> صورة من <b>${imgTotal}</b>`, icon: 'success', timer: 2000, showConfirmButton: false });
    }
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
      let imagesRestored = 0;
      let imagesInBackup = 0;
      for (let i = 0; i < data.length; i++) {
        const brand = data[i];
        try {
          const fd = new FormData();
          fd.append('name', brand.name);
          if (brand.link) fd.append('link', brand.link);
          let hasImage = false;
          if (brand.imageBase64) {
            imagesInBackup++;
            const file = this.backupService.base64ToFile(brand.imageBase64, brand.name);
            if (file) { fd.append('image', file); hasImage = true; }
          }

          await new Promise<void>((resolve) => {
            this.brandService.update(brand.id, fd).subscribe({
              next: () => { success++; if (hasImage) imagesRestored++; resolve(); },
              error: () => {
                const createFd = new FormData();
                createFd.append('name', brand.name);
                if (brand.link) createFd.append('link', brand.link);
                if (brand.imageBase64) {
                  const file = this.backupService.base64ToFile(brand.imageBase64, brand.name);
                  if (file) createFd.append('image', file);
                }
                this.brandService.create(createFd).subscribe({
                  next: () => { success++; if (hasImage) imagesRestored++; resolve(); },
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
      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}<br>صور: ${imagesRestored} / ${imagesInBackup}`, success > 0 ? 'success' : 'error');
      this.loadBrands();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
