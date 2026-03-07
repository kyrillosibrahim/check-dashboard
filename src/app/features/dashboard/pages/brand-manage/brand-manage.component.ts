import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../../../../core/services/brand.service';
import { IBrand } from '../../../../core/models/brand.model';
import { API_CONFIG } from '../../../../core/config/api.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-brand-manage',
  imports: [FormsModule],
  templateUrl: './brand-manage.component.html',
  styleUrl: './brand-manage.component.scss'
})
export class BrandManageComponent implements OnInit {
  private brandService = inject(BrandService);
  private cdr = inject(ChangeDetectorRef);

  brands: IBrand[] = [];
  brandName = '';
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
    this.selectedFile = null;
    this.imagePreview = brand.image ? `${API_CONFIG.uploadsUrl}/${brand.image}` : null;
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
    return brand.image ? `${API_CONFIG.uploadsUrl}/${brand.image}` : '';
  }

  private resetForm(): void {
    this.brandName = '';
    this.selectedFile = null;
    this.imagePreview = null;
    this.editingBrand = null;
    this.isSaving = false;
    this.cdr.markForCheck();
  }
}
