import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MerchantService } from '../../../../core/services/merchant.service';
import { IMerchant } from '../../../../core/models/merchant.model';
import { BackupService } from '../../../../core/services/backup.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-merchant-manage',
  imports: [FormsModule],
  templateUrl: './merchant-manage.component.html',
  styleUrl: './merchant-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MerchantManageComponent implements OnInit {
  private merchantService = inject(MerchantService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

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

  // ─── Backup / Restore ───

  downloadBackup(): void {
    if (!this.merchants.length) {
      Swal.fire('تنبيه', 'لا توجد بيانات تجار لتحميلها', 'warning');
      return;
    }
    this.backupService.downloadJson(this.merchants, 'merchants_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<IMerchant[]>();
      if (!Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات تجار صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم رفع <b>${data.length}</b> تاجر من الملف.<br>هل تريد المتابعة؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، استرجع',
        cancelButtonText: 'إلغاء',
      });
      if (!confirm.isConfirmed) return;

      let success = 0;
      let failed = 0;
      for (const merchant of data) {
        try {
          await new Promise<void>((resolve) => {
            this.merchantService.update(merchant.id, merchant).subscribe({
              next: () => { success++; resolve(); },
              error: () => {
                this.merchantService.create(merchant).subscribe({
                  next: () => { success++; resolve(); },
                  error: () => { failed++; resolve(); }
                });
              }
            });
          });
        } catch {
          failed++;
        }
      }
      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}`, success > 0 ? 'success' : 'error');
      this.loadMerchants();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
