import { Injectable, signal } from '@angular/core';

export interface PinnedItem {
  path: string;
  icon: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class PinnedShortcutsService {
  private readonly STORAGE_KEY = 'sz-pinned-shortcuts';
  readonly items = signal<PinnedItem[]>(this.load());

  isPinned(path: string): boolean {
    return this.items().some(i => i.path === path);
  }

  toggle(item: PinnedItem): void {
    const next = this.isPinned(item.path)
      ? this.items().filter(i => i.path !== item.path)
      : [...this.items(), item];
    this.items.set(next);
    this.save(next);
  }

  remove(path: string): void {
    const next = this.items().filter(i => i.path !== path);
    this.items.set(next);
    this.save(next);
  }

  private load(): PinnedItem[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private save(items: PinnedItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}
