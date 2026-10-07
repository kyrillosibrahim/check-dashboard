import { Pipe, PipeTransform } from '@angular/core';
import { DateInput, formatArDate } from '../utils/date-format';

/** "1 أكتوبر 2026" */
@Pipe({ name: 'arDate', pure: true })
export class ArDatePipe implements PipeTransform {
  transform(value: DateInput): string {
    return formatArDate(value);
  }
}
