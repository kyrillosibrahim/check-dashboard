import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  phone = '';
  password = '';
  showPassword = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);
  failedAttempts = signal(0);
  isLocked = signal(false);
  lockTimer = signal(0);
  private lockInterval: ReturnType<typeof setInterval> | null = null;

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.isLocked()) return;
    this.errorMessage.set('');

    if (!this.phone.trim() || !this.password.trim()) {
      this.errorMessage.set('يرجى إدخال رقم الموبايل وكلمة المرور');
      return;
    }

    this.isLoading.set(true);

    setTimeout(() => {
      const success = this.authService.login(this.phone, this.password);
      this.isLoading.set(false);

      if (success) {
        this.failedAttempts.set(0);
        this.router.navigate(['/products']);
      } else {
        const attempts = this.failedAttempts() + 1;
        this.failedAttempts.set(attempts);

        if (attempts >= 5) {
          this.lockAccount();
        } else {
          this.errorMessage.set(`رقم الموبايل أو كلمة المرور غير صحيحة. (${attempts}/5 محاولات)`);
        }
        this.password = '';
      }
    }, 600);
  }

  private lockAccount(): void {
    this.isLocked.set(true);
    this.errorMessage.set('تم تجاوز عدد المحاولات المسموحة. يرجى الانتظار 2 دقيقة.');
    let seconds = 120;
    this.lockTimer.set(seconds);

    this.lockInterval = setInterval(() => {
      seconds--;
      this.lockTimer.set(seconds);
      if (seconds <= 0) {
        this.isLocked.set(false);
        this.failedAttempts.set(0);
        this.errorMessage.set('');
        if (this.lockInterval) clearInterval(this.lockInterval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.lockInterval) clearInterval(this.lockInterval);
  }
}
