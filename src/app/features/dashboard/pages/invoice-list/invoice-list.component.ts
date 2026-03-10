import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../core/services/order.service';
import { IOrder } from '../../../../core/models/order.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';
import { API_CONFIG } from '../../../../core/config/api.config';
import { BackupService } from '../../../../core/services/backup.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, DatePipe, EgpCurrencyPipe, FormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceListComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private backupService = inject(BackupService);

  orders: IOrder[] = [];
  isLoading = true;
  error = '';
  searchTerm = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = '';
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.orders = orders.map(o => ({
          ...o,
          items: o.items.map(item => ({
            ...item,
            image: item.image ? item.image.replace(/https?:\/\/localhost:\d+/, API_CONFIG.baseUrl) : item.image
          }))
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل الفواتير. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredOrders(): IOrder[] {
    if (!this.searchTerm.trim()) return this.orders;
    const term = this.searchTerm.trim().toLowerCase();
    return this.orders.filter(o =>
      o.id.toLowerCase().includes(term) ||
      (o.customer?.name || '').toLowerCase().includes(term) ||
      (o.customer?.phone || '').includes(term)
    );
  }

  get totalRevenue(): number {
    return this.orders
      .filter(o => o.status === 'delivered' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
  }

  get pendingCount(): number {
    return this.orders.filter(o => o.status === 'pending').length;
  }

  getItemsCount(order: IOrder): number {
    return order.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }

  getFirstImage(order: IOrder): string {
    return order.items?.[0]?.image || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'جاري التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل'
    };
    return labels[status] || status;
  }

  // ─── Backup / Restore ───

  downloadBackup(): void {
    if (!this.orders.length) {
      Swal.fire('تنبيه', 'لا توجد فواتير لتحميلها', 'warning');
      return;
    }
    this.backupService.downloadJson(this.orders, 'invoices_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<IOrder[]>();
      if (!Array.isArray(data)) {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات فواتير صحيحة', 'error');
        return;
      }
      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم رفع <b>${data.length}</b> فاتورة من الملف.<br>هل تريد المتابعة؟`,
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
        const order = data[i];
        try {
          await new Promise<void>((resolve) => {
            this.orderService.update(order.id, order).subscribe({
              next: () => { success++; resolve(); },
              error: () => {
                this.orderService.create(order).subscribe({
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
      this.loadOrders();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
