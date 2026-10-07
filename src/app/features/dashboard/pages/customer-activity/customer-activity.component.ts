import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import {
  CustomerActivityService,
  ICustomerActivity,
  ICustomerActivitySummary,
} from '../../../../core/services/customer-activity.service';
import { formatArDate, formatDateTime, formatTimeAgo } from '../../../../shared/utils/date-format';

interface DisplayCustomerActivity extends ICustomerActivity {
  isPhone: boolean;
  dayName: string;
  dateLabel: string;
  dateFull: string;
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
  selectedIds = signal<Set<string>>(new Set<string>());

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

  selectedCount = computed(() => this.selectedIds().size);

  allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every(r => this.selectedIds().has(r._id));
  });

  someSelected = computed(() => this.selectedCount() > 0 && !this.allSelected());

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
        // Selection is per rendered page: ids kept across a page or filter change
        // would make the counter lie and delete rows the admin cannot see.
        this.selectedIds.set(new Set<string>());
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

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleRow(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set<string>());
      return;
    }
    this.selectedIds.set(new Set(this.rows().map(r => r._id)));
  }

  deleteRow(row: DisplayCustomerActivity): void {
    Swal.fire({
      title: 'حذف هذا السجل؟',
      text: row.title || row.path,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.activityService.deleteOne(row._id).subscribe({
        next: () => {
          this.afterDelete([row._id]);
          Swal.fire('تم', 'تم حذف السجل', 'success');
        },
        error: () => Swal.fire('خطأ', 'فشل حذف السجل', 'error'),
      });
    });
  }

  deleteSelected(): void {
    if (this.selectedCount() === 0) return;
    const ids = [...this.selectedIds()];
    Swal.fire({
      title: 'حذف السجلات المحددة؟',
      text: `سيتم حذف ${ids.length} سجل. هذا الإجراء لا يمكن التراجع عنه.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc3545',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.activityService.deleteMany(ids).subscribe({
        next: response => {
          this.afterDelete(ids);
          Swal.fire('تم', `تم حذف ${response.deleted} سجل`, 'success');
        },
        error: () => Swal.fire('خطأ', 'فشل حذف السجلات', 'error'),
      });
    });
  }

  /** Steps back a page when the last row on it was removed, then reloads. */
  private afterDelete(deletedIds: string[]): void {
    const remaining = this.rows().filter(r => !deletedIds.includes(r._id)).length;
    if (remaining === 0 && this.page() > 1) this.page.set(this.page() - 1);
    this.load();
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
          this.selectedIds.set(new Set<string>());
          Swal.fire('تم', 'تم مسح السجل', 'success');
        },
        error: () => Swal.fire('خطأ', 'فشل مسح السجل', 'error'),
      });
    });
  }
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function decorate(row: ICustomerActivity): DisplayCustomerActivity {
  const d = new Date(row.enteredAt);
  return {
    ...row,
    isPhone: /iPhone|iPad|iPod|Android|Mobile/i.test(row.deviceName || ''),
    dayName: DAYS_AR[d.getDay()],
    dateLabel: formatArDate(d),
    dateFull: formatDateTime(d),
    timeLabel: formatTimeAgo(d),
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
