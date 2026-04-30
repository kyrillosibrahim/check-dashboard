import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subscription, combineLatest, startWith } from 'rxjs';

@Component({
  selector: 'app-price-calculator',
  imports: [ReactiveFormsModule],
  templateUrl: './price-calculator.component.html',
  styleUrl: './price-calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceCalculatorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) form!: FormGroup;
  /** When true, render the minimum-quantity input (used for wholesale offers). */
  @Input() showMinQuantity = false;
  /** When true, hide originalPrice and rename discountedPrice to "السعر فى السلة" (wholesale offers only). */
  @Input() wholesaleMode = false;

  discountPercent = 0;
  profitPercent = 0;
  private sub?: Subscription;

  ngOnInit(): void {
    const wholesaleCtrl = this.form.get('wholesalePrice')!;
    const originalCtrl = this.form.get('originalPrice')!;
    const discountedCtrl = this.form.get('discountedPrice')!;

    if (this.wholesaleMode) {
      if (+discountedCtrl.value > 0) {
        originalCtrl.setValue(+discountedCtrl.value, { emitEvent: false });
      }

      const wholesale$ = wholesaleCtrl.valueChanges.pipe(startWith(wholesaleCtrl.value));
      const discounted$ = discountedCtrl.valueChanges.pipe(startWith(discountedCtrl.value));

      this.sub = combineLatest([wholesale$, discounted$]).subscribe(([w, d]) => {
        originalCtrl.setValue(+d || 0, { emitEvent: false });
        this.discountPercent = 0;
        this.profitPercent = w > 0 ? Math.round(((d - w) / w) * 100 * 100) / 100 : 0;
      });
    } else {
      const wholesale$ = wholesaleCtrl.valueChanges.pipe(startWith(wholesaleCtrl.value));
      const original$ = originalCtrl.valueChanges.pipe(startWith(originalCtrl.value));
      const discounted$ = discountedCtrl.valueChanges.pipe(startWith(discountedCtrl.value));

      this.sub = combineLatest([wholesale$, original$, discounted$]).subscribe(([w, o, d]) => {
        this.discountPercent = o > 0 ? Math.round(((o - d) / o) * 100 * 100) / 100 : 0;
        this.profitPercent = w > 0 ? Math.round(((d - w) / w) * 100 * 100) / 100 : 0;
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
