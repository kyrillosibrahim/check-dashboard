import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../core/services/customer.service';
import { ICustomer } from '../../../../core/models/customer.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-customer-list',
  imports: [FormsModule, DatePipe],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private cdr = inject(ChangeDetectorRef);

  customers: ICustomer[] = [];
  filteredCustomers: ICustomer[] = [];
  searchTerm = '';
  isLoading = true;
  error = '';

  // Edit modal
  editingCustomer: ICustomer | null = null;
  editForm = { name: '', phone: '', email: '', role: '' };

  // Delete modal
  deletingCustomer: ICustomer | null = null;

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = '';
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers = data;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء تحميل البيانات';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(c =>
        c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.email?.toLowerCase().includes(term)
      );
    }
  }

  openEdit(customer: ICustomer): void {
    this.editingCustomer = customer;
    this.editForm = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      role: customer.role,
    };
    this.cdr.markForCheck();
  }

  saveEdit(): void {
    if (!this.editingCustomer) return;
    this.customerService.update(this.editingCustomer.id, this.editForm).subscribe({
      next: (updated) => {
        const i = this.customers.findIndex(c => c.id === updated.id);
        if (i !== -1) this.customers[i] = { ...this.customers[i], ...updated };
        this.applyFilter();
        this.editingCustomer = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء التعديل';
        this.cdr.markForCheck();
      }
    });
  }

  cancelEdit(): void {
    this.editingCustomer = null;
  }

  openDelete(customer: ICustomer): void {
    this.deletingCustomer = customer;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.deletingCustomer) return;
    this.customerService.delete(this.deletingCustomer.id).subscribe({
      next: () => {
        this.customers = this.customers.filter(c => c.id !== this.deletingCustomer!.id);
        this.applyFilter();
        this.deletingCustomer = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء الحذف';
        this.cdr.markForCheck();
      }
    });
  }

  cancelDelete(): void {
    this.deletingCustomer = null;
  }
}
