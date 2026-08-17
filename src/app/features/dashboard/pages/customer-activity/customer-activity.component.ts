import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import {
  CustomerActivityService,
  ICustomerActivity,
  ICustomerActivitySummary,
} from '../../../../core/services/customer-activity.service';

interface DisplayCustomerActivity extends ICustomerActivity {
  dayName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
}

@Component({
  selector: 'app-customer-activity',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './customer-activity.component.html',
  styleUrl: './customer-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerActivityComponent implements OnInit {
  private activityService = inject(CustomerActivityService);

  rows = signal<DisplayCustomerActivity[]>([]);
  summary = signal<ICustomerActivitySummary | null>(null);
  total = signal(0);
  loading = signal(false);
  error = signal('');
  fromDate = signal('');
  toDate = signal('');
  search = signal('');
  onlyRegistered = signal(false);
  page = signal(1);

  readonly pageSize = 50;
  /** Storefront origin, used to turn a tracked path into an openable link. */
  readonly storefrontUrl = environment.storefrontUrl;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  /** Smart page list: 1 … 4 5 [6] 7 8 … 20 */
  pages = computed<(number | '...')[]>(() => {
    const total = this.totalPages();
    const current = Math.min(this.page(), total);
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | '...')[] = [1];
    if (current > 3) out.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
    if (current < total - 2) out.push('...');
    out.push(total);
    return out;
  });

  totalDurationLabel = computed(() =>
    formatDuration(this.summary()?.totalDurationSeconds || 0)
  );

  avgDurationLabel = computed(() => {
    const summary = this.summary();
    if (!summary?.totalEvents) return formatDuration(0);
    return formatDuration(Math.round(summary.totalDurationSeconds / summary.totalEvents));
  });

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
    this.activityService.getActivity({
      from: this.fromDate(),
      to: this.toDate(),
      q: this.search(),
      onlyRegistered: this.onlyRegistered(),
      page: this.page(),
      limit: this.pageSize,
    }).subscribe({
      next: response => {
        this.rows.set(response.items.map(row => decorate(row)));
        this.summary.set(response.summary);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.page.set(page);
      this.load();
    }
  }

  clearAll(): void {
    Swal.fire({
      title: 'مسح السجل بالكامل؟',
      text: 'هذا الإجراء لا يمكن التراجع عنه.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، امسح',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.activityService.deleteAll().subscribe({
        next: () => {
          this.rows.set([]);
          this.summary.set(null);
          this.total.set(0);
          this.page.set(1);
          Swal.fire('تم', 'تم مسح السجل', 'success');
        },
        error: () => Swal.fire('خطأ', 'فشل مسح السجل', 'error'),
      });
    });
  }
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const dateFmt = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('ar-EG', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function decorate(row: ICustomerActivity): DisplayCustomerActivity {
  const d = new Date(row.enteredAt);
  return {
    ...row,
    dayName: DAYS_AR[d.getDay()],
    dateLabel: dateFmt.format(d),
    timeLabel: timeFmt.format(d),
    durationLabel: formatDuration(row.durationSeconds || 0),
  };
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'أقل من ثانية';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} س`);
  if (m) parts.push(`${m} د`);
  if (s || parts.length === 0) parts.push(`${s} ث`);
  return parts.join(' ');
}
