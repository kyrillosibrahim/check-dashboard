import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { GuardianAngelService } from './core/services/guardian-angel.service';
import { ActivityTrackerService } from './core/services/activity-tracker.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  guardianAngel = inject(GuardianAngelService);
  private activityTracker = inject(ActivityTrackerService);
  sidebarOpen = false;

  constructor() {
    this.activityTracker.start();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.sidebarOpen = false;
    this.authService.logout();
  }
}
