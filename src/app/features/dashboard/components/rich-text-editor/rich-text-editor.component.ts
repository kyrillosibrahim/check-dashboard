import { Component, Input, OnInit, forwardRef, HostBinding } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-rich-text-editor',
  imports: [QuillModule, FormsModule],
  template: `
    <div class="editor-wrapper">
      @if (label) {
        <label class="editor-label">{{ label }}</label>
      }
      <quill-editor
        [styles]="editorStyles"
        [modules]="quillModules"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (onContentChanged)="onEditorChange($event)"
        [ngModelOptions]="{standalone: true}"
      />
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
    :host ::ng-deep quill-editor {
      display: block;
      width: 100%;
    }
    :host ::ng-deep .ql-toolbar {
      border-radius: 8px 8px 0 0;
      border-color: var(--sz-border-color, #dee2e6);
      background: var(--sz-bg-secondary, #f8f9fa);
    }
    :host ::ng-deep .ql-container {
      border-radius: 0 0 8px 8px;
      border-color: var(--sz-border-color, #dee2e6);
      font-size: 0.9rem;
      min-height: 200px;
    }
    :host ::ng-deep .ql-editor {
      min-height: 200px;
      direction: rtl;
      text-align: right;
    }
    :host ::ng-deep .ql-editor p,
    :host ::ng-deep .ql-editor h1,
    :host ::ng-deep .ql-editor h2,
    :host ::ng-deep .ql-editor h3,
    :host ::ng-deep .ql-editor h4,
    :host ::ng-deep .ql-editor li,
    :host ::ng-deep .ql-editor blockquote {
      direction: rtl;
      text-align: right;
    }
    :host([dir="ltr"]) ::ng-deep .ql-editor {
      direction: ltr;
      text-align: left;
    }
    :host([dir="ltr"]) ::ng-deep .ql-editor p,
    :host([dir="ltr"]) ::ng-deep .ql-editor h1,
    :host([dir="ltr"]) ::ng-deep .ql-editor h2,
    :host([dir="ltr"]) ::ng-deep .ql-editor h3,
    :host([dir="ltr"]) ::ng-deep .ql-editor h4,
    :host([dir="ltr"]) ::ng-deep .ql-editor li,
    :host([dir="ltr"]) ::ng-deep .ql-editor blockquote {
      direction: ltr;
      text-align: left;
    }
    :host ::ng-deep .ql-editor ol,
    :host ::ng-deep .ql-editor ul {
      padding-right: 1.5em !important;
      padding-left: 0 !important;
    }
    :host ::ng-deep .ql-editor li {
      padding-right: 1.5em !important;
      padding-left: 0 !important;
    }
    :host ::ng-deep .ql-editor li > .ql-ui:before {
      margin-right: -1.5em !important;
      margin-left: 0.3em !important;
      text-align: right !important;
    }
    :host([dir="ltr"]) ::ng-deep .ql-editor ol,
    :host([dir="ltr"]) ::ng-deep .ql-editor ul {
      padding-right: 0 !important;
      padding-left: 1.5em !important;
    }
    :host([dir="ltr"]) ::ng-deep .ql-editor li {
      padding-right: 0 !important;
      padding-left: 1.5em !important;
    }
    :host([dir="ltr"]) ::ng-deep .ql-editor li > .ql-ui:before {
      margin-right: 0.3em !important;
      margin-left: -1.5em !important;
      text-align: left !important;
    }
    :host ::ng-deep .ql-editor.ql-blank::before {
      font-style: normal;
      color: var(--sz-text-secondary, #999);
    }
    :host ::ng-deep .ql-toolbar:focus,
    :host ::ng-deep .ql-toolbar:focus-within,
    :host ::ng-deep .ql-container:focus,
    :host ::ng-deep .ql-container:focus-within,
    :host ::ng-deep .ql-editor:focus {
      border-color: var(--sz-border-color, #dee2e6) !important;
      box-shadow: none !important;
      outline: none !important;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = 'اكتب هنا...';
  @Input() dir: 'rtl' | 'ltr' = 'rtl';

  @HostBinding('attr.dir') get hostDir() { return this.dir; }

  value = '';

  editorStyles: Record<string, string> = {
    'min-height': '200px',
    direction: 'rtl',
    'text-align': 'right'
  };

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ script: 'sub' }, { script: 'super' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    if (this.dir === 'ltr') {
      this.editorStyles = {
        'min-height': '200px',
        direction: 'ltr',
        'text-align': 'left'
      };
    }
  }

  onEditorChange(event: any): void {
    this.onChange(event.html || '');
  }

  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
