import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../core/services/order.service';
import { IOrder } from '../../../../core/models/order.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, DatePipe, EgpCurrencyPipe, FormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);

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
        this.orders = orders;
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
    return this.orders.reduce((sum, o) => sum + o.total, 0);
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
}
