import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly cloudName = environment.cloudinaryCloudName;
  private readonly uploadPreset = environment.cloudinaryUploadPreset;
  private readonly uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
  private readonly videoUploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`;

  async uploadImage(file: File, folder = 'categories'): Promise<string> {
    return this.upload(this.uploadUrl, file, folder, 'فشل رفع الصورة على Cloudinary');
  }

  async uploadVideo(file: File, folder = 'natural-products'): Promise<string> {
    return this.upload(this.videoUploadUrl, file, folder, 'فشل رفع الفيديو على Cloudinary');
  }

  private async upload(url: string, file: File, folder: string, errorMsg: string): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', this.uploadPreset);
    fd.append('folder', folder);
    const response = await fetch(url, { method: 'POST', body: fd });
    if (!response.ok) throw new Error(errorMsg);
    const data = await response.json();
    return data.secure_url as string;
  }
}
