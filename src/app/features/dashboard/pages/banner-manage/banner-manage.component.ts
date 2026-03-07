import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../../core/services/banner.service';
import { ImageCompressionService } from '../../../../core/services/image-compression.service';
import { IBanner } from '../../../../core/models/banner.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-banner-manage',
  imports: [FormsModule],
  templateUrl: './banner-manage.component.html',
  styleUrl: './banner-manage.component.scss'
})
export class BannerManageComponent implements OnInit {
  private bannerService = inject(BannerService);
  private compressionService = inject(ImageCompressionService);
  private cdr = inject(ChangeDetectorRef);

  banners: IBanner[] = [];
  bannerLink = '';
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
    return banner.image ? `${API_CONFIG.uploadsUrl}/${banner.image}` : '';
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.bannerLink = '';
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
}
