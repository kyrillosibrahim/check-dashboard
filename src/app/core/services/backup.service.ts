import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BackupService {

  /**
   * Download data as a JSON file
   */
  downloadJson(data: unknown, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${this.getDateStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Open file picker and read a JSON file, returning parsed data
   */
  restoreJson<T>(): Promise<T> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { reject('لم يتم اختيار ملف'); return; }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result as string) as T;
            resolve(parsed);
          } catch {
            reject('الملف غير صالح – تأكد أنه ملف JSON صحيح');
          }
        };
        reader.onerror = () => reject('فشل قراءة الملف');
        reader.readAsText(file);
      };
      input.click();
    });
  }

  /**
   * Fetch an image URL and convert it to a base64 data URL.
   * Tries fetch first, then canvas fallback.
   * Returns empty string if all methods fail.
   */
  async imageToBase64(imageUrl: string): Promise<string> {
    if (!imageUrl) return '';

    // Method 1: fetch
    try {
      const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-cache' });
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          const result = await this.blobToBase64(blob);
          if (result) return result;
        }
      }
    } catch { /* try fallback */ }

    // Method 2: Image + Canvas fallback
    try {
      return await this.imageToBase64ViaCanvas(imageUrl);
    } catch { /* give up */ }

    return '';
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  }

  private imageToBase64ViaCanvas(imageUrl: string): Promise<string> {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d')!.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/webp'));
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      // timeout after 15s
      setTimeout(() => resolve(''), 15000);
      img.src = imageUrl;
    });
  }

  /**
   * Convert a base64 data URL back to a File object
   */
  base64ToFile(base64: string, filename: string): File | null {
    if (!base64 || !base64.includes(',')) return null;
    try {
      const [header, data] = base64.split(',');
      const mime = header.match(/:(.*?);/)?.[1] || 'image/webp';
      const ext = mime.split('/')[1] || 'webp';
      const byteString = atob(data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const finalName = filename.includes('.') ? filename : `${filename}.${ext}`;
      return new File([ab], finalName, { type: mime });
    } catch {
      return null;
    }
  }

  private getDateStamp(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
