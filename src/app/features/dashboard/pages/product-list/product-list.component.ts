import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { IProduct } from '../../../../core/models/product.model';
import { ICategory } from '../../../../core/models/category.model';
import { ProductTableComponent } from '../../components/product-table/product-table.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-list',
  imports: [ProductTableComponent, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  allProducts: IProduct[] = [];
  products: IProduct[] = [];
  categories: ICategory[] = [];
  selectedCategory = '';
  isLoading = true;
  error = '';

  get featuredCount(): number {
    return this.allProducts.filter(p => p.isFeatured).length;
  }

  get lowStockCount(): number {
    return this.allProducts.filter(p => p.stock < 10).length;
  }

  getCategoryCount(category: string): number {
    return this.allProducts.filter(p => p.category === category).length;
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.products = category
      ? this.allProducts.filter(p => p.category === category)
      : this.allProducts;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(c => {
      this.categories = c;
      this.cdr.markForCheck();
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    this.productService.getAll().subscribe({
      next: (p) => {
        this.allProducts = p;
        this.filterByCategory(this.selectedCategory);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل المنتجات. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onEdit(product: IProduct): void {
    const category = product.categoryFolder || this.productService.generateSlug(product.category);
    this.router.navigate(['/edit', category, product.slug]);
  }

  async onDelete(product: IProduct): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: product.title,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      const category = product.categoryFolder || this.productService.generateSlug(product.category);
      this.productService.deleteProduct(category, product.slug!).subscribe({
        next: () => {
          Swal.fire('تم حذف المنتج!', '', 'success');
          this.loadProducts();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }
}
