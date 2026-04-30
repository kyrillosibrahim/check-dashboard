import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare const $: any;

@Component({
  selector: 'app-rich-text-editor',
  imports: [],
  template: `
    <div class="editor-wrapper">
      @if (label) {
        <label class="editor-label">{{ label }}</label>
      }
      <textarea #editor></textarea>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .editor-wrapper {
      margin-bottom: 0.5rem;
      width: 100%;
    }
    .editor-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--sz-text-secondary);
      margin-bottom: 0.4rem;
    }
    :host ::ng-deep .note-editor.note-frame {
      border-radius: 8px;
      border-color: var(--sz-border-color, #dee2e6);
      max-width: 100%;
      overflow: hidden;
    }
    :host ::ng-deep .note-toolbar {
      border-radius: 8px 8px 0 0;
      background: var(--sz-bg-secondary, #f8f9fa);
      flex-wrap: wrap;
    }
    :host ::ng-deep .note-editing-area {
      max-width: 100%;
      overflow: hidden;
    }
    :host ::ng-deep .note-editing-area .note-editable {
      height: 280px;
      max-height: 280px;
      min-height: 280px;
      font-size: 0.95rem;
      direction: rtl;
      text-align: right;
      background-color: #ffffff !important;
      color: #1a1a2e !important;
      overflow-y: auto;
      overflow-x: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
    }
    :host ::ng-deep .note-editing-area .note-editable * {
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    :host ::ng-deep .note-editing-area .note-editable img {
      max-width: 100%;
      height: auto;
    }
    :host([dir="ltr"]) ::ng-deep .note-editing-area .note-editable {
      direction: ltr;
      text-align: left;
    }
    :host ::ng-deep .note-codable {
      background-color: #ffffff !important;
      color: #1a1a2e !important;
    }
    :host ::ng-deep .note-placeholder {
      color: #6c757d !important;
      font-style: normal;
    }
    :host ::ng-deep .note-editor:focus,
    :host ::ng-deep .note-editor:focus-within {
      outline: none !important;
      box-shadow: none !important;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() label = '';
  @Input() placeholder = 'اكتب هنا...';
  @Input() dir: 'rtl' | 'ltr' = 'rtl';

  @HostBinding('attr.dir') get hostDir() {
    return this.dir;
  }

  @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLTextAreaElement>;

  private pendingValue = '';
  private initialized = false;
  private isDisabled = false;
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const $el = $(this.editorRef.nativeElement);
      $el.summernote({
        lang: this.dir === 'rtl' ? 'ar-AR' : 'en-US',
        direction: this.dir,
        placeholder: this.placeholder,
        height: 220,
        dialogsInBody: true,
        toolbar: [
          ['style', ['style']],
          ['font', ['bold', 'italic', 'underline', 'clear', 'strikethrough', 'superscript', 'subscript']],
          ['fontname', ['fontname']],
          ['fontsize', ['fontsize']],
          ['height', ['height']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['table', ['table']],
          ['insert', ['link', 'picture', 'video', 'hr']],
          ['view', ['fullscreen', 'codeview', 'undo', 'redo']],
        ],
        callbacks: {
          onChange: (contents: string) =>
            this.zone.run(() => this.onChange(contents || '')),
          onBlur: () => this.zone.run(() => this.onTouched()),
        },
      });
      this.initialized = true;
      if (this.pendingValue) {
        $el.summernote('code', this.pendingValue);
      }
      if (this.isDisabled) {
        $el.summernote('disable');
      }
    });
  }

  writeValue(val: string): void {
    this.pendingValue = val || '';
    if (this.initialized) {
      $(this.editorRef.nativeElement).summernote('code', this.pendingValue);
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled = disabled;
    if (this.initialized) {
      $(this.editorRef.nativeElement).summernote(disabled ? 'disable' : 'enable');
    }
  }

  ngOnDestroy(): void {
    if (this.initialized) {
      $(this.editorRef.nativeElement).summernote('destroy');
    }
  }
}
