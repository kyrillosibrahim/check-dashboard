import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface IFaqItem {
  q: string;
  a: string;
  qAr?: string;
  aAr?: string;
}

@Component({
  selector: 'app-faq-editor',
  imports: [FormsModule],
  templateUrl: './faq-editor.component.html',
  styleUrl: './faq-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqEditorComponent {
  @Input() faqs: IFaqItem[] = [];
  @Output() faqsChange = new EventEmitter<IFaqItem[]>();

  faqEnabled = false;
  lang: 'ar' | 'en' = 'ar';

  ngOnInit(): void {
    this.faqEnabled = this.faqs.length > 0;
  }

  onToggle(): void {
    this.faqEnabled = !this.faqEnabled;
    if (this.faqEnabled && this.faqs.length === 0) {
      this.addFaq();
    }
  }

  addFaq(): void {
    this.faqs = [...this.faqs, { q: '', a: '', qAr: '', aAr: '' }];
    this.emit();
  }

  removeFaq(index: number): void {
    this.faqs = this.faqs.filter((_, i) => i !== index);
    this.emit();
    if (this.faqs.length === 0) {
      this.faqEnabled = false;
    }
  }

  onFieldChange(): void {
    this.emit();
  }

  private emit(): void {
    this.faqsChange.emit([...this.faqs]);
  }
}
