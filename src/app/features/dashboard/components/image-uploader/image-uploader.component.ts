import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild } from '@angular/core';
import { ImageCompressionService } from '../../../../core/services/image-compression.service';

@Component({
  selector: 'app-image-uploader',
  imports: [],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss'
})
export class ImageUploaderComponent {
  @Input() label = '';
  @Input() images: string[] = [];
  @Output() imagesChange = new EventEmitter<string[]>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private imageCompression = inject(ImageCompressionService);
  isDragOver = false;
  isProcessing = false;
  lastCompressionInfo = '';

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(files);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
      input.value = '';
    }
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  async processFiles(files: FileList): Promise<void> {
    this.isProcessing = true;
    this.lastCompressionInfo = '';
    const newImages = [...this.images];
    let totalOriginal = 0;
    let totalCompressed = 0;
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const result = await this.imageCompression.compressImage(file);
        newImages.push(result.dataUrl);
        totalOriginal += result.originalKB;
        totalCompressed += result.compressedKB;
        count++;
      } catch (e) {
        console.error('Image compression failed:', e);
      }
    }

    this.images = newImages;
    this.imagesChange.emit(this.images);
    this.isProcessing = false;

    if (count > 0) {
      const saved = totalOriginal - totalCompressed;
      const percent = totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0;
      this.lastCompressionInfo = `${count} img: ${totalOriginal} KB → ${totalCompressed} KB (-${percent}%)`;
    }
  }

  removeImage(index: number): void {
    this.images = this.images.filter((_, i) => i !== index);
    this.imagesChange.emit(this.images);
  }

  moveImage(index: number, direction: -1 | 1): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.images.length) return;
    const arr = [...this.images];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    this.images = arr;
    this.imagesChange.emit(this.images);
  }
}
