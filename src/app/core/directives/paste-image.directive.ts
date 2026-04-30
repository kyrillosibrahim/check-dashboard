import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, inject } from '@angular/core';

@Directive({
  selector: '[pasteImage]',
  standalone: true,
})
export class PasteImageDirective implements OnDestroy {
  private static hoverEl: HTMLElement | null = null;
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Accepted MIME prefix: 'image/' (default), 'video/', or '' for any file. */
  @Input() pasteAccept: string = 'image/';
  @Output() pasteImage = new EventEmitter<File>();
  @Output() dragActive = new EventEmitter<boolean>();

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

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.dragActive.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    // Only emit false if leaving the host element itself (not a child)
    if (!this.el.nativeElement.contains(event.relatedTarget as Node)) {
      this.dragActive.emit(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.emit(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (this.pasteAccept === '' || file.type.startsWith(this.pasteAccept)) {
        this.pasteImage.emit(file);
        return;
      }
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (PasteImageDirective.hoverEl !== this.el.nativeElement) return;
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && (this.pasteAccept === '' || item.type.startsWith(this.pasteAccept))) {
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
