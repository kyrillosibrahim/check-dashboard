import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WholesaleOfferService } from '../../../../core/services/wholesale-offer.service';
import { IWholesaleOffer } from '../../../../core/models/wholesale-offer.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';
import { WholesaleOfferModalComponent } from '../../components/wholesale-offer-modal/wholesale-offer-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wholesale-offers-list',
  imports: [FormsModule, EgpCurrencyPipe, WholesaleOfferModalComponent],
  templateUrl: './wholesale-offers-list.component.html',
  styleUrl: './wholesale-offers-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WholesaleOffersListComponent implements OnInit {
  private wholesaleService = inject(WholesaleOfferService);
  private cdr = inject(ChangeDetectorRef);

  allOffers: IWholesaleOffer[] = [];
  offers: IWholesaleOffer[] = [];

  searchTerm = '';

  isLoading = true;
  error = '';

  modalOpen = false;
  editingOffer: IWholesaleOffer | null = null;

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.isLoading = true;
    this.error = '';
    this.wholesaleService.getAll().subscribe({
      next: (list) => {
        this.allOffers = list;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'فشل تحميل عروض الجملة. تأكد أن السيرفر شغال.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  search(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.allOffers;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(p =>
        (p.titleAr || '').toLowerCase().includes(term) ||
        (p.title || '').toLowerCase().includes(term)
      );
    }
    this.offers = filtered;
    this.cdr.markForCheck();
  }

  openAddModal(): void {
    this.editingOffer = null;
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  onEdit(offer: IWholesaleOffer): void {
    this.editingOffer = offer;
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  onModalClose(): void {
    this.modalOpen = false;
    this.editingOffer = null;
    this.cdr.markForCheck();
  }

  onModalSaved(): void {
    this.loadOffers();
  }

  async onDelete(offer: IWholesaleOffer): Promise<void> {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: offer.titleAr || offer.title,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء',
    });
    if (result.isConfirmed) {
      this.wholesaleService.delete(offer.id).subscribe({
        next: () => {
          Swal.fire('تم الحذف!', '', 'success');
          this.loadOffers();
        },
        error: (err) => {
          Swal.fire('خطأ', err?.error?.error || 'فشل الحذف', 'error');
        }
      });
    }
  }

  getImageUrl(offer: IWholesaleOffer): string {
    const img = offer.mainImages?.[0] || offer.images?.[0];
    if (!img) return 'https://via.placeholder.com/45';
    return img;
  }
}
