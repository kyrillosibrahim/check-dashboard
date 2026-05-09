import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExternalWebsiteService } from '../../../../core/services/external-website.service';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { IExternalWebsite } from '../../../../core/models/external-website.model';
import { PasteImageDirective } from '../../../../core/directives/paste-image.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-external-websites-manage',
  imports: [FormsModule, PasteImageDirective],
  templateUrl: './external-websites-manage.component.html',
  styleUrl: './external-websites-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalWebsitesManageComponent implements OnInit {
  private service = inject(ExternalWebsiteService);
  private cloudinaryService = inject(CloudinaryService);
  private cdr = inject(ChangeDetectorRef);

  websites: IExternalWebsite[] = [];
  editingWebsite: IExternalWebsite | null = null;
  websiteName = '';
  imagePreview: string | null = null;
  selectedImageUrl: string | null = null;
  isUploadingImage = false;
  isDragOver = false;
  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadWebsites();
  }

  loadWebsites(): void {
    this.isLoading = true;
    this.error = '';
    this.service.getAll().subscribe({
      next: (data) => {
        this.websites = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل المواقع. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.processImageFile(file);
  }

  async onPastedImage(file: File): Promise<void> {
    await this.processImageFile(file);
  }

  private async processImageFile(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    this.isUploadingImage = true;
    this.cdr.markForCheck();
    try {
      this.selectedImageUrl = await this.cloudinaryService.uploadImage(file, 'external-websites');
      this.imagePreview = this.selectedImageUrl;
    } catch {
      Swal.fire('خطأ', 'فشل رفع الصورة', 'error');
      this.selectedImageUrl = null;
      this.imagePreview = null;
    } finally {
      this.isUploadingImage = false;
      this.cdr.markForCheck();
    }
  }

  onSave(): void {
    const name = this.websiteName.trim();
    if (!name || !this.selectedImageUrl) return;

    this.isSaving = true;
    const payload = { name, logoUrl: this.selectedImageUrl };

    if (this.editingWebsite) {
      this.service.update(this.editingWebsite.id, payload).subscribe({
        next: () => {
          Swal.fire({ title: 'تم تحديث الموقع!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadWebsites();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          Swal.fire({ title: 'تم إضافة الموقع!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadWebsites();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onEdit(site: IExternalWebsite): void {
    this.editingWebsite = site;
    this.websiteName = site.name;
    this.selectedImageUrl = site.logoUrl;
    this.imagePreview = site.logoUrl;
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.resetForm();
  }

  async onDelete(site: IExternalWebsite): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف موقع "${site.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.service.delete(site.id).subscribe({
        next: () => {
          Swal.fire('تم الحذف!', '', 'success');
          this.loadWebsites();
        },
        error: (err) => Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error')
      });
    }
  }

  private resetForm(): void {
    this.websiteName = '';
    this.selectedImageUrl = null;
    this.imagePreview = null;
    this.editingWebsite = null;
    this.isSaving = false;
    this.cdr.markForCheck();
  }
}
