import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageCompressionService } from '../../../../core/services/image-compression.service';

export interface IOffer {
  text: string;
  textAr?: string;
  image?: string;
}

@Component({
  selector: 'app-offers-editor',
  imports: [FormsModule],
  templateUrl: './offers-editor.component.html',
  styleUrl: './offers-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffersEditorComponent {
  private imageCompression = inject(ImageCompressionService);

  @Input() offers: IOffer[] = [];
  @Output() offersChange = new EventEmitter<IOffer[]>();

  addOffer(): void {
    this.offers = [...this.offers, { text: '', textAr: '', image: '' }];
    this.offersChange.emit(this.offers);
  }

  removeOffer(index: number): void {
    this.offers = this.offers.filter((_, i) => i !== index);
    this.offersChange.emit(this.offers);
  }

  onFieldChange(): void {
    this.offersChange.emit([...this.offers]);
  }

  async onImageSelect(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) return;

    try {
      const result = await this.imageCompression.compressImage(file);
      this.offers[index] = { ...this.offers[index], image: result.dataUrl };
      this.offersChange.emit([...this.offers]);
    } catch (e) {
      console.error('Image compression failed:', e);
    }

    input.value = '';
  }

  removeImage(index: number): void {
    this.offers[index] = { ...this.offers[index], image: '' };
    this.offersChange.emit([...this.offers]);
  }
}
