export interface ICloudinaryUsage {
  plan: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsUsedPercent: number;
  storageBytes: number;
  bandwidthBytes: number;
  transformations: number;
  assets: number;
}

export interface IMongoUsage {
  usedBytes: number;
  dataBytes: number;
  limitBytes: number;
  usedPercent: number;
}

export interface IStorageInfo {
  cloudinary: ICloudinaryUsage | null;
  mongo: IMongoUsage | null;
  cloudinaryError?: string;
  mongoError?: string;
}
