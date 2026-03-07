import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../../../core/services/expense.service';
import { IExpense } from '../../../../core/models/expense.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense-manage',
  imports: [FormsModule, EgpCurrencyPipe],
  templateUrl: './expense-manage.component.html',
  styleUrl: './expense-manage.component.scss'
})
export class ExpenseManageComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private cdr = inject(ChangeDetectorRef);

  expenses: IExpense[] = [];
  isLoading = true;
  isSaving = false;
  error = '';

  // Form fields
  expenseTitle = '';
  expenseCategory = 'إعلانات';
  expenseAmount: number | null = null;
  expenseMonth = '';
  expenseNotes = '';
  editingExpense: IExpense | null = null;

  // Filter
  selectedMonth = '';
  availableMonths: { value: string; label: string }[] = [];

  readonly categories = ['إعلانات', 'أكياس', 'رولات طباعة', 'شحن', 'أخرى'];

  ngOnInit(): void {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonth = currentMonth;
    this.expenseMonth = currentMonth;
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.isLoading = true;
    this.error = '';
    this.expenseService.getAll().subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.buildAvailableMonths();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل البيانات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildAvailableMonths(): void {
    const monthSet = new Set<string>();

    // Add current month always
    const now = new Date();
    monthSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    for (const exp of this.expenses) {
      if (exp.month) monthSet.add(exp.month);
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

  get filteredExpenses(): IExpense[] {
    if (!this.selectedMonth) return this.expenses;
    return this.expenses
      .filter(e => e.month === this.selectedMonth)
      .sort((a, b) => b.id - a.id);
  }

  get monthTotal(): number {
    return this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get allTotal(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get monthCount(): number {
    return this.filteredExpenses.length;
  }

  onSave(): void {
    const title = this.expenseTitle.trim();
    if (!title || !this.expenseAmount || this.expenseAmount <= 0) return;

    this.isSaving = true;
    const data = {
      title,
      category: this.expenseCategory,
      amount: this.expenseAmount,
      month: this.expenseMonth,
      notes: this.expenseNotes.trim(),
    };

    if (this.editingExpense) {
      this.expenseService.update(this.editingExpense.id, data).subscribe({
        next: () => {
          Swal.fire({ title: 'تم تحديث المصروف!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadExpenses();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل التحديث', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.expenseService.create(data).subscribe({
        next: () => {
          Swal.fire({ title: 'تم إضافة المصروف!', icon: 'success', timer: 1500, showConfirmButton: false });
          this.resetForm();
          this.loadExpenses();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الإضافة', 'error');
          this.isSaving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onEdit(expense: IExpense): void {
    this.editingExpense = expense;
    this.expenseTitle = expense.title;
    this.expenseCategory = expense.category;
    this.expenseAmount = expense.amount;
    this.expenseMonth = expense.month;
    this.expenseNotes = expense.notes || '';
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.resetForm();
  }

  async onDelete(expense: IExpense): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `حذف "${expense.title}" — ${expense.amount} ج.م`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.expenseService.delete(expense.id).subscribe({
        next: () => {
          Swal.fire('تم الحذف!', '', 'success');
          this.loadExpenses();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  private resetForm(): void {
    this.expenseTitle = '';
    this.expenseCategory = 'إعلانات';
    this.expenseAmount = null;
    const now = new Date();
    this.expenseMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.expenseNotes = '';
    this.editingExpense = null;
    this.isSaving = false;
    this.cdr.markForCheck();
  }
}
