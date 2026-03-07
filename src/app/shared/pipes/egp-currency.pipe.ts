import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'egpCurrency', pure: true })
export class EgpCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '';
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ج.م`;
  }
}
