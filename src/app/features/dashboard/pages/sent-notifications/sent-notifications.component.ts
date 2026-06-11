import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService, SentCampaign } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-sent-notifications',
  imports: [DatePipe, RouterLink],
  templateUrl: './sent-notifications.component.html',
  styleUrl: './sent-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SentNotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  campaigns = signal<SentCampaign[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.notificationService.getSent().subscribe({
      next: items => { this.campaigns.set(items); this.loading.set(false); this.cdr.markForCheck(); },
      error: () => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  typeLabel(type: string): string {
    return type === 'coupon' ? 'كود خصم' : 'رسالة عامة';
  }
}
