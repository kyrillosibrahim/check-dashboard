import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environments/environment';

interface ActivityLog {
  _id: string;
  username: string;
  path: string;
  title: string;
  enteredAt: string;
  durationSeconds: number;
}

interface DisplayLog extends ActivityLog {
  dayName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
}

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-activity.component.html',
  styleUrl: './admin-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityComponent implements OnInit {
  private http = inject(HttpClient);

  logs = signal<DisplayLog[]>([]);
  isLoading = signal(true);
  error = signal('');
  userFilter = signal<'all' | 'admin' | 'koko'>('all');

  filteredLogs = computed(() => {
    const f = this.userFilter();
    return f === 'all' ? this.logs() : this.logs().filter(l => l.username === f);
  });

  // ── Pagination (50 per page) ──
  readonly pageSize = 50;
  currentPage = signal(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredLogs().length / this.pageSize)));

  pagedLogs = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredLogs().slice(start, start + this.pageSize);
  });

  /** Smart page list: 1 … 4 5 [6] 7 8 … 20 */
  pages = computed<(number | '...')[]>(() => {
    const total = this.totalPages();
    const current = Math.min(this.currentPage(), total);
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | '...')[] = [1];
    if (current > 3) out.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
    if (current < total - 2) out.push('...');
    out.push(total);
    return out;
  });

  totalDuration = computed(() =>
    this.filteredLogs().reduce((sum, l) => sum + (l.durationSeconds || 0), 0)
  );

  totalDurationLabel = computed(() => formatDuration(this.totalDuration()));

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set('');
    this.http
      .get<ActivityLog[]>(`${environment.baseUrl}/api/activity-logs?limit=1000`)
      .subscribe({
        next: data => {
          this.logs.set(data.map(l => decorate(l)));
          this.currentPage.set(1);
          this.isLoading.set(false);
        },
        error: err => {
          this.error.set('فشل تحميل سجل الحركة. تأكد أن السيرفر شغال.');
          this.isLoading.set(false);
          console.error(err);
        },
      });
  }

  setFilter(value: 'all' | 'admin' | 'koko'): void {
    this.userFilter.set(value);
    this.currentPage.set(1);
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
      this.http.delete(`${environment.baseUrl}/api/activity-logs`).subscribe({
        next: () => {
          this.logs.set([]);
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

function decorate(log: ActivityLog): DisplayLog {
  const d = new Date(log.enteredAt);
  return {
    ...log,
    dayName: DAYS_AR[d.getDay()],
    dateLabel: dateFmt.format(d),
    timeLabel: timeFmt.format(d),
    durationLabel: formatDuration(log.durationSeconds || 0),
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
