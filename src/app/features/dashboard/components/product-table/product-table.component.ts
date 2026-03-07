import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IProduct } from '../../../../core/models/product.model';
import { EgpCurrencyPipe } from '../../../../shared/pipes/egp-currency.pipe';
import { API_CONFIG } from '../../../../core/config/api.config';

@Component({
  selector: 'app-product-table',
  imports: [EgpCurrencyPipe],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.scss'
})
export class ProductTableComponent {
  @Input({ required: true }) products: IProduct[] = [];
  @Output() edit = new EventEmitter<IProduct>();
  @Output() delete = new EventEmitter<IProduct>();

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

  getImageUrl(product: IProduct): string {
    const img = product.images?.[0] || product.mainImages?.[0];
    if (!img) return 'https://via.placeholder.com/45';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${API_CONFIG.uploadsUrl}/${img}`;
  }
}
