import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GuardianAngelService {
  private readonly STORAGE_KEY = 'ga_selected_days';

  readonly selectedDays = signal<Set<string>>(this.load());
  readonly isTodaySelected = computed(() => this.selectedDays().has(GuardianAngelService.todayKey()));

  randomize(year: number, month: number): void {
    const weeks = this.buildWeeksForMonth(year, month);
    const picked = new Set<string>();

    for (const week of weeks) {
      const days = week.filter((d): d is Date => d !== null);
      if (days.length === 0) continue;
      const shuffled = this.shuffle(days);
      picked.add(GuardianAngelService.dateKey(shuffled[0]));
    }

    this.selectedDays.set(picked);
    this.save(picked);
  }

  reset(): void {
    this.selectedDays.set(new Set<string>());
    this.save(new Set<string>());
  }

  private buildWeeksForMonth(year: number, month: number): (Date | null)[][] {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const weeks: (Date | null)[][] = [];

    const dayOfWeekSatStart = (d: Date) => (d.getDay() + 1) % 7;

    let current: (Date | null)[] = [];
    const leadingBlanks = dayOfWeekSatStart(firstOfMonth);
    for (let i = 0; i < leadingBlanks; i++) current.push(null);

    for (let day = 1; day <= lastOfMonth.getDate(); day++) {
      current.push(new Date(year, month, day));
      if (current.length === 7) {
        weeks.push(current);
        current = [];
      }
    }

    if (current.length > 0) {
      while (current.length < 7) current.push(null);
      weeks.push(current);
    }

    return weeks;
  }

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private load(): Set<string> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
  }

  private save(days: Set<string>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...days]));
  }

  static dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  static todayKey(): string {
    return GuardianAngelService.dateKey(new Date());
  }
}
