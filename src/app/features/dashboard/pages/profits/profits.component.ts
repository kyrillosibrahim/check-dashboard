import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { BackupService } from '../../../../core/services/backup.service';
import { IOrder } from '../../../../core/models/order.model';
import { IProduct } from '../../../../core/models/product.model';
import { IExpense } from '../../../../core/models/expense.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';

interface DailyProfit {
  date: string;
  orderCount: number;
  sales: number;
  profit: number;
}

interface ReturnedOrder {
  id: string;
  customerName: string;
  shippingCost: number;
  total: number;
  date: string;
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
  imports: [EgpCurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './profits.component.html',
  styleUrl: './profits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfitsComponent implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private expenseService = inject(ExpenseService);
  private backupService = inject(BackupService);
  private cdr = inject(ChangeDetectorRef);

  orders: IOrder[] = [];
  products: IProduct[] = [];
  expenses: IExpense[] = [];
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
    let expensesLoaded = false;

    const checkDone = () => {
      if (ordersLoaded && productsLoaded && expensesLoaded) {
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

    this.expenseService.getAll().subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        expensesLoaded = true;
        checkDone();
      },
      error: () => {
        this.expenses = [];
        expensesLoaded = true;
        checkDone();
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

  private calcOrderProfit(order: IOrder): number {
    if (order.storeProfitTotal) return order.storeProfitTotal;
    const productMap = new Map(this.products.map(p => [p.id, p]));
    let profit = 0;
    for (const item of order.items) {
      const product = productMap.get(item.productId);
      if (product?.wholesalePrice) {
        const sellPrice = product.discountedPrice || product.price;
        profit += (sellPrice - product.wholesalePrice) * item.quantity;
      }
    }
    return profit;
  }

  get totalSales(): number {
    return this.orders
      .filter(o => o.status === 'delivered' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }

  get totalReturnsLossAll(): number {
    return this.orders
      .filter(o => o.status === 'delivered' && o.paymentStatus === 'unpaid')
      .reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  }

  get totalProfit(): number {
    return this.paidOrders.reduce((sum, o) => sum + this.calcOrderProfit(o), 0) - this.totalReturnsLossAll - this.totalExpensesAll;
  }

  get monthGrossProfit(): number {
    return this.paidMonthOrders.reduce((sum, o) => sum + this.calcOrderProfit(o), 0);
  }

  get monthProfit(): number {
    return this.monthGrossProfit - this.totalReturnsLoss - this.monthExpensesTotal;
  }

  showMonthProfitDetails(): void {
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ج.م';

    let expensesHtml = '';
    if (this.monthExpenses.length > 0) {
      const expenseLines = this.monthExpenses.map(e =>
        `<div style="display:flex; justify-content:space-between; font-size:0.9rem; color:#6c757d;">
          <span>${e.title} (${e.category})</span>
          <span>-${fmt(e.amount)}</span>
        </div>`
      ).join('');
      expensesHtml = `
        <div style="display:flex; justify-content:space-between;">
          <span>المصروفات (${this.monthExpenses.length}) :</span>
          <span style="color:#dc3545; font-weight:700;">-${fmt(this.monthExpensesTotal)}</span>
        </div>
        ${expenseLines}
      `;
    }

    Swal.fire({
      title: 'تفاصيل أرباح الشهر',
      html: `
        <div dir="rtl" style="font-size:1rem; line-height:2.2;">
          <div style="display:flex; justify-content:space-between;">
            <span>الربح :</span>
            <span style="color:#198754; font-weight:700;">${fmt(this.monthGrossProfit)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>خسائر المرتجعات (${this.returnedOrders.length}) :</span>
            <span style="color:#dc3545; font-weight:700;">-${fmt(this.totalReturnsLoss)}</span>
          </div>
          ${expensesHtml}
          <hr style="margin:0.5rem 0;">
          <div style="display:flex; justify-content:space-between; font-size:1.1rem;">
            <span style="font-weight:700;">القيمة النهائية :</span>
            <span style="color:#0d6efd; font-weight:700;">${fmt(this.monthProfit)}</span>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'تمام',
      confirmButtonColor: '#1bbc9b',
    });
  }

  get todayProfit(): number {
    const today = new Date().toDateString();
    const todayOrders = this.orders.filter(o => new Date(o.date).toDateString() === today);
    const profit = todayOrders
      .filter(o => !(o.status === 'delivered' && o.paymentStatus === 'unpaid'))
      .reduce((sum, o) => sum + this.calcOrderProfit(o), 0);
    const loss = todayOrders
      .filter(o => o.status === 'delivered' && o.paymentStatus === 'unpaid')
      .reduce((sum, o) => sum + (o.shippingCost || 0), 0);
    return profit - loss;
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

  /** Month orders excluding returned (delivered + unpaid) */
  private get paidMonthOrders(): IOrder[] {
    return this.monthOrders.filter(o => !(o.status === 'delivered' && o.paymentStatus === 'unpaid'));
  }

  private get paidOrders(): IOrder[] {
    return this.orders.filter(o => !(o.status === 'delivered' && o.paymentStatus === 'unpaid'));
  }

  // ── Daily profits table ──

  get dailyProfits(): DailyProfit[] {
    const map = new Map<string, DailyProfit>();

    for (const order of this.paidMonthOrders) {
      const d = new Date(order.date);
      const key = d.toISOString().split('T')[0];

      if (!map.has(key)) {
        map.set(key, { date: key, orderCount: 0, sales: 0, profit: 0 });
      }
      const entry = map.get(key)!;
      entry.orderCount++;
      entry.sales += order.total || 0;
      entry.profit += this.calcOrderProfit(order);
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
    return this.paidMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }

  get paidMonthOrdersCount(): number {
    return this.paidMonthOrders.length;
  }

  // ── Returned orders (delivered + unpaid) ──

  get returnedOrders(): ReturnedOrder[] {
    return this.monthOrders
      .filter(o => o.status === 'delivered' && o.paymentStatus === 'unpaid')
      .map(o => ({
        id: o.id,
        customerName: o.customer.name || '---',
        shippingCost: o.shippingCost || 0,
        total: o.total || 0,
        date: o.date
      }));
  }

  get totalReturnsLoss(): number {
    return this.returnedOrders.reduce((sum, o) => sum + o.shippingCost, 0);
  }

  // ── Expenses ──

  get monthExpenses(): IExpense[] {
    return this.expenses.filter(e => e.month === this.selectedMonth);
  }

  get monthExpensesTotal(): number {
    return this.monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  get totalExpensesAll(): number {
    return this.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  // ─── Backup / Restore ───

  downloadBackup(): void {
    const data = {
      orders: this.orders,
      expenses: this.expenses,
      exportDate: new Date().toISOString(),
    };
    this.backupService.downloadJson(data, 'profits_backup');
    Swal.fire({ title: 'تم تحميل النسخة الاحتياطية!', icon: 'success', timer: 1500, showConfirmButton: false });
  }

  async restoreBackup(): Promise<void> {
    try {
      const data = await this.backupService.restoreJson<{ orders?: IOrder[]; expenses?: IExpense[] }>();
      if (!data || typeof data !== 'object') {
        Swal.fire('خطأ', 'الملف لا يحتوى على بيانات صحيحة', 'error');
        return;
      }

      const orderCount = data.orders?.length || 0;
      const expenseCount = data.expenses?.length || 0;

      const confirm = await Swal.fire({
        title: 'استرجاع البيانات',
        html: `سيتم استرجاع:<br><b>${orderCount}</b> طلب<br><b>${expenseCount}</b> مصروف<br>هل تريد المتابعة؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، استرجع',
        cancelButtonText: 'إلغاء',
      });
      if (!confirm.isConfirmed) return;

      let success = 0;
      let failed = 0;

      if (data.orders?.length) {
        for (const order of data.orders) {
          try {
            await new Promise<void>((resolve) => {
              this.orderService.update(order.id, order).subscribe({
                next: () => { success++; resolve(); },
                error: () => { failed++; resolve(); }
              });
            });
          } catch { failed++; }
        }
      }

      if (data.expenses?.length) {
        for (const expense of data.expenses) {
          try {
            await new Promise<void>((resolve) => {
              this.expenseService.create(expense).subscribe({
                next: () => { success++; resolve(); },
                error: () => { failed++; resolve(); }
              });
            });
          } catch { failed++; }
        }
      }

      await Swal.fire('تم الاسترجاع', `نجح: ${success} | فشل: ${failed}`, success > 0 ? 'success' : 'error');
      this.loadData();
    } catch (err) {
      if (err) Swal.fire('خطأ', String(err), 'error');
    }
  }
}
