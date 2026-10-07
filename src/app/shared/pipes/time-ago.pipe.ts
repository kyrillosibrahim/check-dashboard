import { Pipe, PipeTransform } from '@angular/core';
import { DateInput, formatTimeAgo } from '../utils/date-format';

/** "منذ ساعة و7 دقايق" — computed at render time. */
@Pipe({ name: 'timeAgo', pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: DateInput): string {
    return formatTimeAgo(value);
  }
}
