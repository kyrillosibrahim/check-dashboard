import { Pipe, PipeTransform } from '@angular/core';
import { DateInput, formatDateTime } from '../utils/date-format';

/** "1 أكتوبر 2026 - 3:45 م" — used for tooltips. */
@Pipe({ name: 'dateTime', pure: true })
export class DateTimePipe implements PipeTransform {
  transform(value: DateInput): string {
    return formatDateTime(value);
  }
}
