import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { GuardianAngelService } from './core/services/guardian-angel.service';
import { ActivityTrackerService } from './core/services/activity-tracker.service';
import { KeepAliveService } from './core/services/keep-alive.service';
import { BadgeService } from './core/services/badge.service';
import { SidebarStateService } from './core/services/sidebar-state.service';
import { PinnedShortcutsService, PinnedItem } from './core/services/pinned-shortcuts.service';

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
  badges = inject(BadgeService);
  sidebarState = inject(SidebarStateService);
  pinned = inject(PinnedShortcutsService);
  private activityTracker = inject(ActivityTrackerService);
  private keepAlive = inject(KeepAliveService);
  private router = inject(Router);
  sidebarOpen = false;

  constructor() {
    this.activityTracker.start();
    this.keepAlive.start();

    // Sidebar badges: refresh on load, on every navigation, and every 60s.
    this.badges.refresh();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.badges.refresh());
    setInterval(() => this.badges.refresh(), 60_000);
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

  togglePin(event: Event, item: PinnedItem): void {
    event.preventDefault();
    event.stopPropagation();
    this.pinned.toggle(item);
  }

  logout(): void {
    this.sidebarOpen = false;
    this.authService.logout();
  }
}
