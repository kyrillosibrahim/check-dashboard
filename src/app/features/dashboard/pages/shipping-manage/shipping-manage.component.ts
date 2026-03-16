import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GovernorateService } from '../../../../core/services/governorate.service';
import { IGovernorate } from '../../../../core/models/governorate.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shipping-manage',
  imports: [FormsModule],
  templateUrl: './shipping-manage.component.html',
  styleUrl: './shipping-manage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShippingManageComponent implements OnInit {
  private governorateService = inject(GovernorateService);
  private cdr = inject(ChangeDetectorRef);

  governorates: IGovernorate[] = [];
  editedCosts: Map<number, number> = new Map();
  isLoading = true;
  isSaving = false;
  error = '';
  companyName = '';

  ngOnInit(): void {
    const saved = localStorage.getItem('shippingCompanyName');
    if (saved) this.companyName = saved;
    this.loadGovernorates();
  }

  loadGovernorates(): void {
    this.isLoading = true;
    this.error = '';
    this.governorateService.getAll().subscribe({
      next: (data) => {
        this.governorates = data;
        this.editedCosts.clear();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل المحافظات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCompanyNameChange(): void {
    localStorage.setItem('shippingCompanyName', this.companyName);
  }

  onCostChange(gov: IGovernorate, newCost: number): void {
    this.editedCosts.set(gov.id, newCost);
  }

  hasChanges(gov: IGovernorate): boolean {
    return this.editedCosts.has(gov.id) && this.editedCosts.get(gov.id) !== gov.shippingCost;
  }

  get totalChanges(): number {
    let count = 0;
    this.editedCosts.forEach((cost, id) => {
      const gov = this.governorates.find(g => g.id === id);
      if (gov && cost !== gov.shippingCost) count++;
    });
    return count;
  }

  saveSingle(gov: IGovernorate): void {
    const newCost = this.editedCosts.get(gov.id);
    if (newCost === undefined || newCost === gov.shippingCost) return;

    this.governorateService.updateShippingCost(gov.id, newCost).subscribe({
      next: (updated) => {
        gov.shippingCost = updated.shippingCost;
        this.editedCosts.delete(gov.id);
        Swal.fire({ title: `تم تحديث سعر شحن ${gov.governorate_name_ar}`, icon: 'success', timer: 1500, showConfirmButton: false });
        this.cdr.markForCheck();
      },
      error: (err) => {
        Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
      }
    });
  }

  async saveAll(): Promise<void> {
    const changes: { gov: IGovernorate; cost: number }[] = [];
    this.editedCosts.forEach((cost, id) => {
      const gov = this.governorates.find(g => g.id === id);
      if (gov && cost !== gov.shippingCost) {
        changes.push({ gov, cost });
      }
    });

    if (changes.length === 0) {
      Swal.fire('تنبيه', 'لا توجد تغييرات لحفظها', 'info');
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    Swal.fire({
      title: 'جاري حفظ التغييرات...',
      html: `0 / ${changes.length}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < changes.length; i++) {
      const { gov, cost } = changes[i];
      try {
        await new Promise<void>((resolve, reject) => {
          this.governorateService.updateShippingCost(gov.id, cost).subscribe({
            next: (updated) => {
              gov.shippingCost = updated.shippingCost;
              this.editedCosts.delete(gov.id);
              success++;
              resolve();
            },
            error: () => { failed++; resolve(); }
          });
        });
      } catch {
        failed++;
      }
      Swal.update({ html: `${i + 1} / ${changes.length}` });
    }

    this.isSaving = false;
    this.cdr.markForCheck();

    Swal.fire({
      title: 'تم الحفظ',
      html: `نجح: <b>${success}</b>${failed > 0 ? ` | فشل: <b>${failed}</b>` : ''}`,
      icon: failed > 0 ? 'warning' : 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
