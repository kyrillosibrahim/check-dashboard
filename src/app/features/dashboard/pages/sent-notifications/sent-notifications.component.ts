import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
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

  // A coupon code can be advertised by several campaigns, and the server only
  // cancels the code once the last of them is gone. Counting the others here
  // stops the confirmation promising a cancellation that will not happen.
  private otherCampaignsWithCode(c: SentCampaign): number {
    const code = c.coupon?.code;
    if (!code) return 0;
    return this.campaigns().filter(item => item.id !== c.id && item.coupon?.code === code).length;
  }

  async remove(c: SentCampaign): Promise<void> {
    const code = c.type === 'coupon' ? c.coupon?.code || '' : '';
    const others = code ? this.otherCampaignsWithCode(c) : 0;
    const confirmationLines = ['سيتم حذف صف الحملة، وسيختفي الإشعار من صناديق وارد العملاء.'];
    if (code && others > 0) {
      confirmationLines.push(`كود الخصم ${code} سيظل يعمل، لأن ${others} حملة أخرى ما زالت تستخدمه.`);
    } else if (code) {
      confirmationLines.push(`كود الخصم ${code} سيتوقف عن العمل.`);
    }
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      html: confirmationLines.join('<br>'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'نعم، احذفها!',
      cancelButtonText: 'إلغاء',
    });
    if (!result.isConfirmed) return;

    try {
      const response = await firstValueFrom(this.notificationService.deleteSent(c.id));
      this.campaigns.update(campaigns => campaigns.filter(campaign => campaign.id !== c.id));
      this.cdr.markForCheck();

      const resultLines = [`تم حذف ${response.notificationsDeleted} إشعارًا من صناديق وارد العملاء.`];
      if (response.couponCode && response.couponRemoved) {
        resultLines.push(`توقف كود الخصم ${response.couponCode} عن العمل.`);
      } else if (response.couponCode) {
        resultLines.push(
          `تحذير: كود الخصم ${response.couponCode} ما زال يعمل لأن عدد الحملات الأخرى التي لا تزال تستخدمه هو ${response.otherCampaignsWithSameCode}.`
        );
      }

      Swal.fire({
        title: 'تم الحذف',
        html: resultLines.join('<br>'),
        icon: response.couponCode && !response.couponRemoved ? 'warning' : 'success',
      });
    } catch {
      Swal.fire('خطأ', 'فشل حذف الإشعار', 'error');
    }
  }

  typeLabel(type: string): string {
    return type === 'coupon' ? 'كود خصم' : 'رسالة عامة';
  }
}
