import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CustomerActivityService,
  ICustomerFunnel,
  ICustomerFunnelStage,
} from '../../../../core/services/customer-activity.service';

interface DisplayFunnelStage extends ICustomerFunnelStage {
  value: number;
  width: number;
  continuedPercent: number | null;
  lost: number | null;
}

@Component({
  selector: 'app-customer-funnel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './customer-funnel.component.html',
  styleUrl: './customer-funnel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFunnelComponent implements OnInit {
  private activityService = inject(CustomerActivityService);

  funnel = signal<ICustomerFunnel | null>(null);
  loading = signal(false);
  error = signal('');
  fromDate = signal('');
  toDate = signal('');

  stages = computed<DisplayFunnelStage[]>(() => {
    const stages = this.funnel()?.stages ?? [];
    const firstValue = stages[0]?.devices ?? 0;

    return stages.map((stage, index) => {
      const value = stageValue(stage);
      const previousValue = index > 0 ? stageValue(stages[index - 1]) : null;

      return {
        ...stage,
        value,
        width: firstValue > 0 ? Math.min(100, (value / firstValue) * 100) : 0,
        continuedPercent: previousValue === null || previousValue === 0
          ? null
          : Math.round((value / previousValue) * 100),
        lost: previousValue === null || previousValue === 0
          ? null
          : Math.max(0, previousValue - value),
      };
    });
  });

  empty = computed(() => {
    const funnel = this.funnel();
    return funnel !== null && funnel.stages.every(stage => stageValue(stage) === 0);
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
    this.activityService.getFunnel(this.fromDate(), this.toDate()).subscribe({
      next: response => {
        this.funnel.set(response);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false);
      },
    });
  }
}

function stageValue(stage?: ICustomerFunnelStage): number {
  return stage?.count ?? stage?.devices ?? 0;
}
