import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private readonly STORAGE_KEY = 'sz-sidebar-collapsed';
  readonly collapsed = signal<boolean>(this.load());

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
  }

  private load(): boolean {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'false') === true;
    } catch {
      return false;
    }
  }
}
