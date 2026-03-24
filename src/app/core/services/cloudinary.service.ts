import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly cloudName = environment.cloudinaryCloudName;
  private readonly uploadPreset = environment.cloudinaryUploadPreset;
  private readonly uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  async uploadImage(file: File, folder = 'categories'): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', this.uploadPreset);
    fd.append('folder', folder);

    const response = await fetch(this.uploadUrl, { method: 'POST', body: fd });
    if (!response.ok) {
      throw new Error('فشل رفع الصورة على Cloudinary');
    }
    const data = await response.json();
    return data.secure_url as string;
  }
}
