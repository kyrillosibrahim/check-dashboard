import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../../core/models/product.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';
import { API_CONFIG } from '../../../../core/config/api.config';

@Component({
  selector: 'app-product-table',
  imports: [EgpCurrencyPipe, RouterLink],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTableComponent {
  @Input({ required: true }) products: IProduct[] = [];
  @Input() sort = '';
  @Output() edit = new EventEmitter<IProduct>();
  @Output() delete = new EventEmitter<IProduct>();
  @Output() sortProfit = new EventEmitter<'high' | 'low'>();

  getDiscountPercent(p: IProduct): number {
    const orig = p.originalPrice || p.price;
    const disc = p.discountedPrice || 0;
    return orig > 0 ? Math.round(((orig - disc) / orig) * 100) : 0;
  }

  getProfitPercent(p: IProduct): number {
    const w = p.wholesalePrice || 0;
    const d = p.discountedPrice || 0;
    return w > 0 ? Math.round(((d - w) / w) * 100) : 0;
  }

  /** Profit in EGP = selling price − wholesale (cost). Null when no wholesale price set. */
  getProfitEgp(p: IProduct): number | null {
    if (!p.wholesalePrice) return null;
    const selling = p.discountedPrice || p.price || 0;
    return selling - p.wholesalePrice;
  }

  /** Toggle profit sort direction and notify the parent. */
  toggleProfitSort(): void {
    this.sortProfit.emit(this.sort === 'profit-high' ? 'low' : 'high');
  }

  getEditUrl(product: IProduct): string[] {
    const category = product.categoryFolder ||
      product.category.toLowerCase().trim()
        .replace(/[^\w\s\u0600-\u06FF-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return ['/edit', category, product.slug!];
  }

  getImageUrl(product: IProduct): string {
    const img = product.images?.[0] || product.mainImages?.[0];
    if (!img) return 'https://via.placeholder.com/45';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${API_CONFIG.uploadsUrl}/${img}`;
  }
}
