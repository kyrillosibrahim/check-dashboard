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

  private readonly defaultGovernorates: IGovernorate[] = [
    { id: 1, governorate_name_en: 'Cairo', governorate_name_ar: 'القاهرة', shippingCost: 0 },
    { id: 2, governorate_name_en: 'Giza', governorate_name_ar: 'الجيزة', shippingCost: 0 },
    { id: 3, governorate_name_en: 'Alexandria', governorate_name_ar: 'الإسكندرية', shippingCost: 0 },
    { id: 4, governorate_name_en: 'Dakahlia', governorate_name_ar: 'الدقهلية', shippingCost: 0 },
    { id: 5, governorate_name_en: 'Sharqia', governorate_name_ar: 'الشرقية', shippingCost: 0 },
    { id: 6, governorate_name_en: 'Qalyubia', governorate_name_ar: 'القليوبية', shippingCost: 0 },
    { id: 7, governorate_name_en: 'Gharbia', governorate_name_ar: 'الغربية', shippingCost: 0 },
    { id: 8, governorate_name_en: 'Menoufia', governorate_name_ar: 'المنوفية', shippingCost: 0 },
    { id: 9, governorate_name_en: 'Beheira', governorate_name_ar: 'البحيرة', shippingCost: 0 },
    { id: 10, governorate_name_en: 'Kafr El Sheikh', governorate_name_ar: 'كفر الشيخ', shippingCost: 0 },
    { id: 11, governorate_name_en: 'Damietta', governorate_name_ar: 'دمياط', shippingCost: 0 },
    { id: 12, governorate_name_en: 'Port Said', governorate_name_ar: 'بورسعيد', shippingCost: 0 },
    { id: 13, governorate_name_en: 'Ismailia', governorate_name_ar: 'الإسماعيلية', shippingCost: 0 },
    { id: 14, governorate_name_en: 'Suez', governorate_name_ar: 'السويس', shippingCost: 0 },
    { id: 15, governorate_name_en: 'Fayoum', governorate_name_ar: 'الفيوم', shippingCost: 0 },
    { id: 16, governorate_name_en: 'Beni Suef', governorate_name_ar: 'بني سويف', shippingCost: 0 },
    { id: 17, governorate_name_en: 'Minya', governorate_name_ar: 'المنيا', shippingCost: 0 },
    { id: 18, governorate_name_en: 'Asyut', governorate_name_ar: 'أسيوط', shippingCost: 0 },
    { id: 19, governorate_name_en: 'Sohag', governorate_name_ar: 'سوهاج', shippingCost: 0 },
    { id: 20, governorate_name_en: 'Qena', governorate_name_ar: 'قنا', shippingCost: 0 },
    { id: 21, governorate_name_en: 'Luxor', governorate_name_ar: 'الأقصر', shippingCost: 0 },
    { id: 22, governorate_name_en: 'Aswan', governorate_name_ar: 'أسوان', shippingCost: 0 },
    { id: 23, governorate_name_en: 'Red Sea', governorate_name_ar: 'البحر الأحمر', shippingCost: 0 },
    { id: 24, governorate_name_en: 'North Sinai', governorate_name_ar: 'شمال سيناء', shippingCost: 0 },
    { id: 25, governorate_name_en: 'South Sinai', governorate_name_ar: 'جنوب سيناء', shippingCost: 0 },
    { id: 26, governorate_name_en: 'Matrouh', governorate_name_ar: 'مطروح', shippingCost: 0 },
    { id: 27, governorate_name_en: 'New Valley', governorate_name_ar: 'الوادي الجديد', shippingCost: 0 },
  ];

  governorates: IGovernorate[] = [];
  editedCosts: Map<number, number> = new Map();
  editedExtras: Map<number, number> = new Map();
  isLoading = true;
  isSaving = false;
  error = '';

  ngOnInit(): void {
    this.loadGovernorates();
  }

  loadGovernorates(): void {
    this.isLoading = true;
    this.error = '';
    this.governorateService.getAll().subscribe({
      next: (data) => {
        this.governorates = this.mergeWithDefaults(data);
        this.editedCosts.clear();
        this.editedExtras.clear();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.governorates = [...this.defaultGovernorates];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private mergeWithDefaults(backendData: IGovernorate[]): IGovernorate[] {
    const map = new Map(backendData.map(g => [g.id, g]));
    return this.defaultGovernorates.map(def => map.get(def.id) || { ...def });
  }

  onCostChange(gov: IGovernorate, newCost: number): void {
    this.editedCosts.set(gov.id, newCost);
  }

  onExtraChange(gov: IGovernorate, newExtra: number): void {
    this.editedExtras.set(gov.id, newExtra);
  }

  private costChanged(gov: IGovernorate): boolean {
    return this.editedCosts.has(gov.id) && this.editedCosts.get(gov.id) !== gov.shippingCost;
  }

  private extraChanged(gov: IGovernorate): boolean {
    return this.editedExtras.has(gov.id) && this.editedExtras.get(gov.id) !== (gov.extraShippingCost || 0);
  }

  hasChanges(gov: IGovernorate): boolean {
    return this.costChanged(gov) || this.extraChanged(gov);
  }

  get totalChanges(): number {
    return this.governorates.filter(g => this.hasChanges(g)).length;
  }

  async saveAll(): Promise<void> {
    const changes = this.governorates
      .filter(g => this.hasChanges(g))
      .map(gov => ({
        gov,
        cost: this.editedCosts.get(gov.id) ?? gov.shippingCost,
        extra: this.editedExtras.get(gov.id) ?? (gov.extraShippingCost || 0),
      }));

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
      const { gov, cost, extra } = changes[i];
      try {
        await new Promise<void>((resolve) => {
          this.governorateService.updateShippingCost(gov.id, cost, extra).subscribe({
            next: (updated) => {
              gov.shippingCost = updated.shippingCost;
              gov.extraShippingCost = updated.extraShippingCost ?? extra;
              this.editedCosts.delete(gov.id);
              this.editedExtras.delete(gov.id);
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
