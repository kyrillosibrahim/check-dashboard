import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteVisitService, ISiteVisit } from '../../../../core/services/site-visit.service';

@Component({
  selector: 'app-customer-visits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-visits.component.html',
  styleUrl: './customer-visits.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerVisitsComponent implements OnInit {
  private visitService = inject(SiteVisitService);

  visits = signal<ISiteVisit[]>([]);
  loading = signal(false);
  error = signal('');

  fromDate = signal('');
  toDate = signal('');

  page = signal(1);
  pageSize = 20;

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    this.fromDate.set(weekAgo);
    this.toDate.set(today);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.page.set(1);
    this.visitService.getVisits(this.fromDate(), this.toDate()).subscribe({
      next: data => {
        this.visits.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false);
      },
    });
  }

  get paged(): ISiteVisit[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.visits().slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.visits().length / this.pageSize));
  }

  get totalVisits(): number {
    return this.visits().reduce((s, v) => s + v.visitCount, 0);
  }

  prevPage(): void {
    if (this.page() > 1) this.page.update(p => p - 1);
  }

  nextPage(): void {
    if (this.page() < this.totalPages) this.page.update(p => p + 1);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
