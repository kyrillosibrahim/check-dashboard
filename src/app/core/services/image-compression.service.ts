import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageCompressionService {

  async compressImage(file: File, maxWidth = 600, maxHeight = 600): Promise<{ dataUrl: string; originalKB: number; compressedKB: number }> {
    const originalKB = Math.round(file.size / 1024);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxHeight) {
            const ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);

          const targetKB = 80;
          let quality = 0.6;
          let dataUrl = canvas.toDataURL('image/webp', quality);

          while (this.getBase64SizeKB(dataUrl) > targetKB && quality > 0.15) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/webp', quality);
          }

          if (this.getBase64SizeKB(dataUrl) > targetKB) {
            const scale = 0.6;
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            dataUrl = canvas.toDataURL('image/webp', 0.5);
          }

          const compressedKB = this.getBase64SizeKB(dataUrl);
          resolve({ dataUrl, originalKB, compressedKB });
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getBase64SizeKB(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || '';
    return Math.round((base64.length * 3) / 4 / 1024);
  }
}
