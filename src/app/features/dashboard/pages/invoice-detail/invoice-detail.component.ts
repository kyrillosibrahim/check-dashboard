import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { OrderService } from '../../../../core/services/order.service';
import { IOrder } from '../../../../core/models/order.model';
import { DatePipe } from '@angular/common';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';

@Component({
  selector: 'app-invoice-detail',
  imports: [FormsModule, EgpCurrencyPipe, DatePipe],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss'
})
export class InvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

  order: IOrder | null = null;
  showModal = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.orderService.getById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.cdr.markForCheck();
      },
      error: () => {
        this.router.navigate(['/invoices']);
      }
    });
  }

  get itemsCount(): number {
    return this.order?.items.reduce((s, i) => s + i.quantity, 0) || 0;
  }

  get subtotal(): number {
    return this.order?.items.reduce((s, i) => s + i.total, 0) || 0;
  }

  get totalAfterDiscounts(): number {
    return this.subtotal - (this.order?.discount || 0);
  }

  get grandTotal(): number {
    return this.totalAfterDiscounts + (this.order?.shippingCost || 0);
  }

  showProfit(): void {
    const profit = this.order?.storeProfitTotal || 0;
    Swal.fire({
      title: 'الربحية',
      text: `قيمة الربحية الاجمالية ${profit.toFixed(1)}`,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#7c5cbf',
    });
  }

  printInvoice(): void {
    window.print();
  }

  openInvoiceModal(): void {
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeInvoiceModal(): void {
    this.showModal = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.showModal) this.closeInvoiceModal();
  }

  async saveInvoice(): Promise<void> {
    if (!this.order) return;
    try {
      await firstValueFrom(this.orderService.update(this.order.id, {
        shippingCompany: this.order.shippingCompany,
        shippingCost: this.order.shippingCost,
        status: this.order.status,
        paymentStatus: this.order.paymentStatus,
        notes: this.order.notes,
        storeProfitTotal: this.order.storeProfitTotal,
        systemCommission: this.order.systemCommission,
        shippingAddress: this.order.shippingAddress,
      }));
      Swal.fire({ title: 'تم حفظ الفاتورة!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire('خطأ', 'فشل حفظ الفاتورة', 'error');
    }
  }

  async deleteInvoice(): Promise<void> {
    if (!this.order) return;
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف الفاتورة #${this.order.id}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفها!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      try {
        await firstValueFrom(this.orderService.delete(this.order.id));
        Swal.fire({ title: 'تم حذف الفاتورة!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.router.navigate(['/invoices']);
      } catch {
        Swal.fire('خطأ', 'فشل حذف الفاتورة', 'error');
      }
    }
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      unpaid: 'لم يتم السداد',
      paid: 'تم السداد',
    };
    return labels[status] || status;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'جاري التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
    };
    return labels[status] || status;
  }
}
