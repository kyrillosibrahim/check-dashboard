import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../../core/services/banner.service';
import { ImageCompressionService } from '../../../../core/services/image-compression.service';
import { IBanner } from '../../../../core/models/banner.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import { BackupService } from '../../../../core/services/backup.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-banner-manage',
  imports: [FormsModule],
  templateUrl: './banner-manage.component.html',
  styleUrl: './banner-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerManageComponent implements OnInit {
  private bannerService = inject(BannerService);
  private compressionService = inject(ImageCompressionService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  banners: IBanner[] = [];
  bannerLink = '';
  bannerPage: 'home' | 'offers' | 'home-below' = 'home';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  compressionInfo = '';
  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.isLoading = true;
    this.error = '';
    this.bannerService.getAll().subscribe({
      next: (banners) => {
        this.banners = banners;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل البنرات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        const result = await this.compressionService.compressImage(file, 1200, 600);
        this.imagePreview = result.dataUrl;
        this.compressionInfo = `${result.originalKB} KB → ${result.compressedKB} KB`;

        // Convert compressed dataUrl back to File for upload
        const blob = this.dataUrlToBlob(result.dataUrl);
        this.selectedFile = new File([blob], 'banner.webp', { type: 'image/webp' });
        this.cdr.markForCheck();
      } catch {
        Swal.fire('خطأ', 'فشل ضغط الصورة', 'error');
      }
    }
  }

  onSave(): void {
    if (!this.selectedFile) return;

    this.isSaving = true;
    const fd = new FormData();
    fd.append('image', this.selectedFile);
    fd.append('link', this.bannerLink.trim());
    fd.append('page', this.bannerPage);

    this.bannerService.create(fd).subscribe({
      next: () => {
        Swal.fire({ title: 'تم إضافة البنر!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.resetForm();
        this.loadBanners();
      },
      error: (err) => {
        Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  async onDelete(banner: IBanner): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'حذف هذا البنر',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.bannerService.delete(banner.id).subscribe({
        next: () => {
          Swal.fire('تم حذف البنر!', '', 'success');
          this.loadBanners();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  getImageUrl(banner: IBanner): string {
    return banner.image ? (banner.image.startsWith('http') ? banner.image : `${API_CONFIG.uploadsUrl}/${banner.image}`) : '';
  }

  getPageLabel(page: string): string {
    if (page === 'offers') return 'صفحة العروض';
    if (page === 'home-below') return 'أسفل السلايدر';
    return 'الصفحة الرئيسية';
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.bannerLink = '';
    this.bannerPage = 'home';
    this.compressionInfo = '';
    this.isSaving = false;
    this.cdr.markForCheck();
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/webp';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  }

  // ─── Backup / Restore ───

  async downloadBackup(): Promise<void> {
    if (!this.banners.length) {
      Swal.fire('تنبيه', 'لا توجد بنرات لتحميلها', 'warning');
      return;
    }

    Swal.fire({ title: 'جاري تجهيز النسخة الاحتياطية...', html: '0 / ' + this.banners.length, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const bannersWithImages = [];
    let imgOk = 0;
    let imgTotal = 0;
    for (let i = 0; i < this.banners.length; i++) {
      const banner = this.banners[i];
      const imageUrl = this.getImageUrl(banner);
      let imageBase64 = '';
      if (imageUrl) {
        imgTotal++;
        imageBase64 = await this.backupService.imageToBase64(imageUrl);
        if (imageBase64) imgOk++;
      }
      bannersWithImages.push({ ...banner, imageBase64 });
      Swal.update({ html: `${i + 1} / ${this.banners.length}` });
    }

    this.backupService.downloadJson(bannersWithImages, 'banners_backup');

    if (imgTotal > 0 && imgOk < imgTotal) {
      Swal.fire({ title: 'تم التحميل', html: `تم حفظ <b>${imgOk}</b> صورة من <b>${imgTotal}</b><br>بعض الصور لم يتم تحميلها`, icon: 'warning' });
    } else {
      Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', html: `تم حفظ <b>${imgOk}</b> صورة من <b>${imgTotal}</b>`, icon: 'success', timer: 2000, showConfirmButton: false });
    }
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<(IBanner & { imageBase64?: string })[]>();
      if (!Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات بنرات صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم رفع <b>${data.length}</b> بنر من الملف.<br>هل تريد المتابعة؟`,
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
      for (let i = 0; i < data.length; i++) {
        const banner = data[i];
        try {
          const fd = new FormData();
          fd.append('link', banner.link || '');
          fd.append('page', banner.page || 'home');

          let hasImage = false;
          if (banner.imageBase64) {
            const file = this.backupService.base64ToFile(banner.imageBase64, `banner-${Date.now()}`);
            if (file) { fd.append('image', file); hasImage = true; }
          }

          await new Promise<void>((resolve) => {
            // Try update first (image optional), fallback to create (image required)
            this.bannerService.update(banner.id, fd).subscribe({
              next: () => { success++; if (hasImage) imagesRestored++; resolve(); },
              error: () => {
                if (!hasImage) { failed++; resolve(); return; }
                // Create requires image - only try if we have one
                const createFd = new FormData();
                createFd.append('link', banner.link || '');
                createFd.append('page', banner.page || 'home');
                if (banner.imageBase64) {
                  const file = this.backupService.base64ToFile(banner.imageBase64, `banner-${Date.now()}`);
                  if (file) createFd.append('image', file);
                }
                this.bannerService.create(createFd).subscribe({
                  next: () => { success++; imagesRestored++; resolve(); },
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
      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}<br>صور: ${imagesRestored} / ${data.length}`, success > 0 ? 'success' : 'error');
      this.loadBanners();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
