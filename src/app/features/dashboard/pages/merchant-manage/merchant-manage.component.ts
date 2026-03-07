import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MerchantService } from '../../../../core/services/merchant.service';
import { IMerchant } from '../../../../core/models/merchant.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-merchant-manage',
  imports: [FormsModule],
  templateUrl: './merchant-manage.component.html',
  styleUrl: './merchant-manage.component.scss'
})
export class MerchantManageComponent implements OnInit {
  private merchantService = inject(MerchantService);
  private cdr = inject(ChangeDetectorRef);

  merchants: IMerchant[] = [];
  merchantName = '';
  merchantPhone = '';
  merchantAddress = '';
  merchantNotes = '';
  editingMerchant: IMerchant | null = null;
  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadMerchants();
  }

  loadMerchants(): void {
    this.isLoading = true;
    this.error = '';
    this.merchantService.getAll().subscribe({
      next: (merchants) => {
        this.merchants = merchants;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل التجار. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSave(): void {
    const name = this.merchantName.trim();
    if (!name) return;

    this.isSaving = true;
    const data = {
      name,
      phone: this.merchantPhone.trim(),
      address: this.merchantAddress.trim(),
      notes: this.merchantNotes.trim(),
    };

    if (this.editingMerchant) {
      this.merchantService.update(this.editingMerchant.id, data).subscribe({
        next: () => {
          Swal.fire({ title: 'تم تحديث التاجر!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadMerchants();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.merchantService.create(data).subscribe({
        next: () => {
          Swal.fire({ title: 'تم إضافة التاجر!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadMerchants();
        },
        error: (err) => {
          if (err?.status === 409) {
            Swal.fire('خطأ', 'هذا التاجر موجود بالفعل!', 'error');
          } else {
            Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
          }
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onEdit(merchant: IMerchant): void {
    this.editingMerchant = merchant;
    this.merchantName = merchant.name;
    this.merchantPhone = merchant.phone || '';
    this.merchantAddress = merchant.address || '';
    this.merchantNotes = merchant.notes || '';
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.resetForm();
  }

  async onDelete(merchant: IMerchant): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف التاجر "${merchant.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.merchantService.delete(merchant.id).subscribe({
        next: () => {
          Swal.fire('تم حذف التاجر!', '', 'success');
          this.loadMerchants();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  private resetForm(): void {
    this.merchantName = '';
    this.merchantPhone = '';
    this.merchantAddress = '';
    this.merchantNotes = '';
    this.editingMerchant = null;
    this.isSaving = false;
    this.cdr.markForCheck();
  }
}
