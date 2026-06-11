import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { NotificationService, SendNotificationPayload } from '../../../../core/services/notification.service';

type Audience = 'all' | 'orderStatus';

@Component({
  selector: 'app-customer-notifications',
  imports: [FormsModule, RouterLink],
  templateUrl: './customer-notifications.component.html',
  styleUrl: './customer-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerNotificationsComponent {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  type: 'general' | 'coupon' = 'general';
  title = '';
  body = '';
  link = '';
  couponCode = '';
  couponPercentage: number | null = null;

  audience: Audience = 'all';
  orderStatus = 'shipped';

  isSending = false;

  readonly statuses = [
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'processing', label: 'جاري التجهيز' },
    { value: 'shipped', label: 'تم الشحن' },
    { value: 'delivered', label: 'تم التوصيل' },
  ];

  setType(t: 'general' | 'coupon'): void {
    this.type = t;
  }

  send(): void {
    if (!this.body.trim() && !this.title.trim()) {
      Swal.fire('تنبيه', 'اكتب نص الرسالة أولاً', 'warning');
      return;
    }
    if (this.type === 'coupon' && (!this.couponCode.trim() || !this.couponPercentage)) {
      Swal.fire('تنبيه', 'كود الخصم ونسبته مطلوبان', 'warning');
      return;
    }

    const target: SendNotificationPayload['target'] =
      this.audience === 'orderStatus' ? { orderStatus: this.orderStatus } : 'all';

    const payload: SendNotificationPayload = {
      type: this.type,
      title: this.title.trim(),
      body: this.body.trim(),
      link: this.link.trim() || undefined,
      target,
    };
    if (this.type === 'coupon') {
      payload.coupon = { code: this.couponCode.trim().toUpperCase(), discountPercentage: Number(this.couponPercentage) };
    }

    this.isSending = true;
    this.notificationService.send(payload).subscribe({
      next: res => {
        Swal.fire({
          icon: 'success',
          title: 'تم الإرسال',
          text: `وصلت الرسالة إلى ${res.sent} عميل (${res.audience})`,
          timer: 2500,
          showConfirmButton: false,
        });
        this.resetForm();
        this.isSending = false;
        this.cdr.markForCheck();
      },
      error: err => {
        Swal.fire('خطأ', err?.error?.error || 'فشل إرسال الإشعار', 'error');
        this.isSending = false;
        this.cdr.markForCheck();
      },
    });
  }

  private resetForm(): void {
    this.title = '';
    this.body = '';
    this.link = '';
    this.couponCode = '';
    this.couponPercentage = null;
  }
}
