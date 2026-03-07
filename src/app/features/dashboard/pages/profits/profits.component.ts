import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { IOrder } from '../../../../core/models/order.model';
import { IProduct } from '../../../../core/models/product.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';

interface DailyProfit {
  date: string;
  orderCount: number;
  sales: number;
  profit: number;
}

interface MerchantProfit {
  name: string;
  itemCount: number;
  sales: number;
  cost: number;
  profit: number;
  profitPercent: number;
}

@Component({
  selector: 'app-profits',
  imports: [EgpCurrencyPipe, DatePipe, FormsModule],
  templateUrl: './profits.component.html',
  styleUrl: './profits.component.scss'
})
export class ProfitsComponent implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  orders: IOrder[] = [];
  products: IProduct[] = [];
  isLoading = true;
  error = '';

  /** Month filter (YYYY-MM) */
  selectedMonth = '';
  availableMonths: { value: string; label: string }[] = [];

  ngOnInit(): void {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = '';

    let ordersLoaded = false;
    let productsLoaded = false;

    const checkDone = () => {
      if (ordersLoaded && productsLoaded) {
        this.buildAvailableMonths();
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    };

    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.orders = orders;
        ordersLoaded = true;
        checkDone();
      },
      error: () => {
        this.error = 'فشل تحميل البيانات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
        productsLoaded = true;
        checkDone();
      },
      error: () => {
        this.error = 'فشل تحميل المنتجات.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildAvailableMonths(): void {
    const monthSet = new Set<string>();
    for (const order of this.orders) {
      const d = new Date(order.date);
      if (!isNaN(d.getTime())) {
        monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    }

    const months = Array.from(monthSet).sort().reverse();
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    this.availableMonths = months.map(m => {
      const [y, mo] = m.split('-');
      return { value: m, label: `${monthNames[+mo - 1]} ${y}` };
    });

    if (!months.includes(this.selectedMonth) && months.length > 0) {
      this.selectedMonth = months[0];
    }
  }

  // ── Stats ──

  get totalSales(): number {
    return this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }

  get totalProfit(): number {
    return this.orders.reduce((sum, o) => sum + (o.storeProfitTotal || 0), 0);
  }

  get monthProfit(): number {
    return this.monthOrders.reduce((sum, o) => sum + (o.storeProfitTotal || 0), 0);
  }

  get todayProfit(): number {
    const today = new Date().toDateString();
    return this.orders
      .filter(o => new Date(o.date).toDateString() === today)
      .reduce((sum, o) => sum + (o.storeProfitTotal || 0), 0);
  }

  // ── Month filter ──

  get monthOrders(): IOrder[] {
    if (!this.selectedMonth) return this.orders;
    const [y, m] = this.selectedMonth.split('-').map(Number);
    return this.orders.filter(o => {
      const d = new Date(o.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }

  // ── Daily profits table ──

  get dailyProfits(): DailyProfit[] {
    const map = new Map<string, DailyProfit>();

    for (const order of this.monthOrders) {
      const d = new Date(order.date);
      const key = d.toISOString().split('T')[0];

      if (!map.has(key)) {
        map.set(key, { date: key, orderCount: 0, sales: 0, profit: 0 });
      }
      const entry = map.get(key)!;
      entry.orderCount++;
      entry.sales += order.total || 0;
      entry.profit += order.storeProfitTotal || 0;
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  // ── Merchant profits table ──

  get merchantProfits(): MerchantProfit[] {
    const map = new Map<string, MerchantProfit>();
    const productMap = new Map(this.products.map(p => [p.id, p]));

    for (const order of this.orders) {
      for (const item of order.items) {
        const merchantName = item.merchant || 'غير محدد';

        if (!map.has(merchantName)) {
          map.set(merchantName, {
            name: merchantName,
            itemCount: 0,
            sales: 0,
            cost: 0,
            profit: 0,
            profitPercent: 0
          });
        }

        const entry = map.get(merchantName)!;
        entry.itemCount += item.quantity;
        entry.sales += item.total || (item.price * item.quantity);

        const product = productMap.get(item.productId);
        if (product?.wholesalePrice) {
          entry.cost += product.wholesalePrice * item.quantity;
        }
      }
    }

    for (const entry of map.values()) {
      entry.profit = entry.sales - entry.cost;
      entry.profitPercent = entry.cost > 0
        ? Math.round(((entry.sales - entry.cost) / entry.cost) * 100)
        : 0;
    }

    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }

  get monthSales(): number {
    return this.monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }
}
