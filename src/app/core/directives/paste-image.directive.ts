import { Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';

@Directive({
  selector: '[pasteImage]',
  standalone: true,
})
export class PasteImageDirective implements OnDestroy {
  private static hoverEl: HTMLElement | null = null;
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  @Output() pasteImage = new EventEmitter<File>();

  @HostListener('mouseenter')
  onMouseEnter(): void {
    PasteImageDirective.hoverEl = this.el.nativeElement;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (PasteImageDirective.hoverEl === this.el.nativeElement) {
      PasteImageDirective.hoverEl = null;
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (PasteImageDirective.hoverEl !== this.el.nativeElement) return;
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          this.pasteImage.emit(file);
          return;
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (PasteImageDirective.hoverEl === this.el.nativeElement) {
      PasteImageDirective.hoverEl = null;
    }
  }
}
