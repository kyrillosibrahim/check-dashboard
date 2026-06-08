import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ProductReviewService } from '../../../../core/services/product-review.service';
import { IProductReview } from '../../../../core/models/product-review.model';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-reviews',
  imports: [FormsModule, DatePipe],
  templateUrl: './product-reviews.component.html',
  styleUrl: './product-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductReviewsComponent implements OnInit {
  private reviewService = inject(ProductReviewService);
  private cdr = inject(ChangeDetectorRef);

  reviews: IProductReview[] = [];
  filteredReviews: IProductReview[] = [];
  searchTerm = '';
  filterStatus: 'all' | 'pending' | 'approved' = 'all';
  isLoading = true;
  error = '';

  readonly stars = [1, 2, 3, 4, 5];

  // View modal
  viewingReview: IProductReview | null = null;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = '';
    this.reviewService.getAll().subscribe({
      next: (data) => {
        this.reviews = data || [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء تحميل التقييمات';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilter(): void {
    let list = this.reviews;

    if (this.filterStatus === 'approved') {
      list = list.filter(r => r.status === 'approved');
    } else if (this.filterStatus === 'pending') {
      list = list.filter(r => r.status !== 'approved');
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(r =>
        (r.productTitle || '').toLowerCase().includes(term) ||
        (r.userName || '').toLowerCase().includes(term) ||
        (r.comment || '').toLowerCase().includes(term)
      );
    }

    this.filteredReviews = list;
  }

  /** Open the product page on the storefront in a new tab. */
  openProduct(review: IProductReview): void {
    window.open(`${environment.storefrontUrl}/product/${review.productId}`, '_blank');
  }

  viewReview(review: IProductReview): void {
    this.viewingReview = review;
    this.cdr.markForCheck();
  }

  closeView(): void {
    this.viewingReview = null;
  }

  async approveReview(review: IProductReview): Promise<void> {
    const result = await Swal.fire({
      title: 'الموافقة على التقييم',
      html: `هل تريد نشر تقييم <strong>${review.userName || ''}</strong>؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، وافق',
      cancelButtonText: 'إلغاء',
    });
    if (!result.isConfirmed) return;

    this.reviewService.approve(review.id).subscribe({
      next: () => {
        review.status = 'approved';
        this.applyFilter();
        this.cdr.markForCheck();
        Swal.fire({ title: 'تمت الموافقة على التقييم', icon: 'success', timer: 1500, showConfirmButton: false });
      },
      error: (err) => Swal.fire('خطأ', err?.error?.error || 'فشلت الموافقة', 'error'),
    });
  }

  async disableUser(review: IProductReview): Promise<void> {
    const result = await Swal.fire({
      title: 'تعطيل المستخدم',
      html: `هل تريد تعطيل <strong>${review.userName || ''}</strong> من التقييم؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، عطّل',
      cancelButtonText: 'إلغاء',
    });
    if (!result.isConfirmed) return;

    this.reviewService.disableUser(review.userId).subscribe({
      next: () => Swal.fire({ title: 'تم تعطيل المستخدم من التقييم', icon: 'success', timer: 1500, showConfirmButton: false }),
      error: (err) => Swal.fire('خطأ', err?.error?.error || 'فشل التعطيل', 'error'),
    });
  }

  async deleteReview(review: IProductReview): Promise<void> {
    const result = await Swal.fire({
      title: 'حذف التقييم',
      text: `سيتم حذف تقييم ${review.userName || ''}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (!result.isConfirmed) return;

    this.reviewService.delete(review.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== review.id);
        this.applyFilter();
        this.cdr.markForCheck();
        Swal.fire({ title: 'تم حذف التقييم', icon: 'success', timer: 1500, showConfirmButton: false });
      },
      error: (err) => Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error'),
    });
  }
}
