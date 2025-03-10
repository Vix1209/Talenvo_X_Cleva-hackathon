import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryUploadService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB total file size limit

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // Validate file
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided or file is empty');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of 6MB. Current file size: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`,
      );
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    try {
      // Upload directly without chunking for better reliability
      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const stream = Readable.from(file.buffer);
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
              allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Restrict to common image formats
              transformation: [
                { quality: 'auto' }, // Optimize quality
                { fetch_format: 'auto' }, // Deliver in optimal format
              ],
            },
            (error, result) => {
              if (error) {
                console.error('Upload error:', JSON.stringify(error, null, 2));
                return reject(new Error(`Upload failed: ${error.message}`));
              }
              if (!result) {
                return reject(new Error('Upload failed: No result returned'));
              }
              resolve(result as { secure_url: string });
            },
          );
          stream.pipe(uploadStream);
        },
      );
      return uploadResult.secure_url;
    } catch (error) {
      console.error('Upload error details:', JSON.stringify(error, null, 2));
      throw new BadRequestException(
        `Failed to upload image: ${error.message || 'Unknown error'}`,
      );
    }
  }
}
