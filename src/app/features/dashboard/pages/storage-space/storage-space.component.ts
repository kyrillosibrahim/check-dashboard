import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StorageService } from '../../../../core/services/storage.service';
import { IStorageInfo } from '../../../../core/models/storage.model';

/** Average uploaded image size (MB) used only for the friendly estimate. */
const AVG_IMAGE_MB = 0.5;

@Component({
  selector: 'app-storage-space',
  imports: [DecimalPipe],
  templateUrl: './storage-space.component.html',
  styleUrl: './storage-space.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageSpaceComponent implements OnInit {
  private storageService = inject(StorageService);
  private cdr = inject(ChangeDetectorRef);

  info: IStorageInfo | null = null;
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.storageService.getStorage().subscribe({
      next: (data) => {
        this.info = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'حدث خطأ أثناء تحميل بيانات المساحة';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Cloudinary helpers ──
  get creditsRemaining(): number {
    const c = this.info?.cloudinary;
    if (!c) return 0;
    return Math.max(0, Math.round((c.creditsLimit - c.creditsUsed) * 100) / 100);
  }

  /** Friendly estimate of how many more images can be uploaded. */
  get estimatedImagesLeft(): number {
    // On the free plan 1 credit ≈ 1 GB storage; remaining storage ≈ remaining credits.
    const remainingMb = this.creditsRemaining * 1024;
    return Math.max(0, Math.floor(remainingMb / AVG_IMAGE_MB));
  }

  // ── Mongo helpers ──
  get mongoRemainingBytes(): number {
    const m = this.info?.mongo;
    if (!m) return 0;
    return Math.max(0, m.limitBytes - m.usedBytes);
  }

  /** Color class by usage percentage (green < 70, yellow 70-90, red > 90). */
  barClass(percent: number): string {
    if (percent >= 90) return 'bar-danger';
    if (percent >= 70) return 'bar-warning';
    return 'bar-ok';
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  }

  clamp(percent: number): number {
    return Math.min(100, Math.max(0, percent));
  }
}
