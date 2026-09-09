export interface UploadedFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface StorageProvider {
  upload(file: UploadedFileInput): Promise<{ url: string }>;
}
