import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuardianAngelService } from '../../../../core/services/guardian-angel.service';

interface DayCell {
  date: Date | null;
  dayNumber: number;
  isFirstOfMonth: boolean;
  isLastOfMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-guardian-angel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guardian-angel.component.html',
  styleUrl: './guardian-angel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuardianAngelComponent {
  private readonly service = inject(GuardianAngelService);

  private readonly today = new Date();
  private readonly viewMonth = signal({ year: this.today.getFullYear(), month: this.today.getMonth() });

  readonly monthLabel = computed(() => {
    const { year, month } = this.viewMonth();
    return new Date(year, month, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  });

  readonly weeks = computed<DayCell[][]>(() => {
    const { year, month } = this.viewMonth();
    const selected = this.service.selectedDays();
    const todayKey = this.dateKey(this.today);
    const lastDayNum = new Date(year, month + 1, 0).getDate();

    const firstOfMonth = new Date(year, month, 1);
    const dayOfWeekSatStart = (d: Date) => (d.getDay() + 1) % 7;

    const grid: DayCell[][] = [];
    let row: DayCell[] = [];
    const leading = dayOfWeekSatStart(firstOfMonth);
    for (let i = 0; i < leading; i++) {
      row.push(this.emptyCell());
    }

    for (let day = 1; day <= lastDayNum; day++) {
      const date = new Date(year, month, day);
      const key = this.dateKey(date);
      row.push({
        date,
        dayNumber: day,
        isFirstOfMonth: day === 1,
        isLastOfMonth: day === lastDayNum,
        isToday: key === todayKey,
        isSelected: selected.has(key)
      });
      if (row.length === 7) {
        grid.push(row);
        row = [];
      }
    }

    if (row.length > 0) {
      while (row.length < 7) row.push(this.emptyCell());
      grid.push(row);
    }

    return grid;
  });

  randomize(): void {
    const { year, month } = this.viewMonth();
    this.service.randomize(year, month);
  }

  reset(): void {
    this.service.reset();
  }

  private emptyCell(): DayCell {
    return {
      date: null,
      dayNumber: 0,
      isFirstOfMonth: false,
      isLastOfMonth: false,
      isToday: false,
      isSelected: false
    };
  }

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
