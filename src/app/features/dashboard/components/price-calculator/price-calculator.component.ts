import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subscription, combineLatest, startWith } from 'rxjs';

@Component({
  selector: 'app-price-calculator',
  imports: [ReactiveFormsModule],
  templateUrl: './price-calculator.component.html',
  styleUrl: './price-calculator.component.scss'
})
export class PriceCalculatorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) form!: FormGroup;

  discountPercent = 0;
  profitPercent = 0;
  private sub?: Subscription;

  ngOnInit(): void {
    const wholesale$ = this.form.get('wholesalePrice')!.valueChanges.pipe(startWith(this.form.get('wholesalePrice')!.value));
    const original$ = this.form.get('originalPrice')!.valueChanges.pipe(startWith(this.form.get('originalPrice')!.value));
    const discounted$ = this.form.get('discountedPrice')!.valueChanges.pipe(startWith(this.form.get('discountedPrice')!.value));

    this.sub = combineLatest([wholesale$, original$, discounted$]).subscribe(([w, o, d]) => {
      this.discountPercent = o > 0 ? Math.round(((o - d) / o) * 100 * 100) / 100 : 0;
      this.profitPercent = w > 0 ? Math.round(((d - w) / w) * 100 * 100) / 100 : 0;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
