import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryUploadService {
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
  private readonly MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB for videos
  private readonly ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'webm'];
  private readonly ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Uploads an image file to Cloudinary with optimized settings
   * @param file The image file to upload
   * @param folder The folder path in Cloudinary
   * @returns The secure URL of the uploaded image
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // Validate file
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided or file is empty');
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
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
              allowed_formats: this.ALLOWED_IMAGE_FORMATS,
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

  /**
   * Uploads a video file to Cloudinary with optimized settings for course content
   * @param file The video file to upload
   * @param folder The folder path in Cloudinary
   * @returns The secure URL of the uploaded video
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    // Validate file
    if (!file || !file.buffer) {
      throw new BadRequestException('No video file provided or file is empty');
    }

    // Validate file type
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException(
        'Invalid file type. Only video files are allowed.',
      );
    }

    // Validate file size
    if (file.size > this.MAX_VIDEO_SIZE) {
      throw new BadRequestException(
        `Video size exceeds the maximum limit of ${this.MAX_VIDEO_SIZE / (1024 * 1024 * 1024)}GB. Current size: ${(
          file.size /
          (1024 * 1024 * 1024)
        ).toFixed(2)}GB`,
      );
    }

    // Validate file format
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.ALLOWED_VIDEO_FORMATS.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid video format. Only ${this.ALLOWED_VIDEO_FORMATS.join(', ')} formats are allowed.`,
      );
    }

    try {
      const uploadResult = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const stream = Readable.from(file.buffer);
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'video',
              allowed_formats: this.ALLOWED_VIDEO_FORMATS,
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' },
                { width: 1920, height: 1080, crop: 'limit' }, // Limit max resolution
                { video_codec: 'auto' }, // Optimize video codec
                { audio_codec: 'auto' }, // Optimize audio codec
                { bit_rate: 'auto' }, // Optimize bitrate
                { duration: 'max:3600' }, // Limit video duration to 1 hour
                { streaming_profile: 'hd' }, // Use HD streaming profile
              ],
            },
            (error, result) => {
              if (error) {
                console.error(
                  'Video upload error:',
                  JSON.stringify(error, null, 2),
                );
                return reject(
                  new Error(`Video upload failed: ${error.message}`),
                );
              }
              if (!result) {
                return reject(
                  new Error('Video upload failed: No result returned'),
                );
              }
              resolve(result as { secure_url: string });
            },
          );
          stream.pipe(uploadStream);
        },
      );
      return uploadResult.secure_url;
    } catch (error) {
      console.error(
        'Video upload error details:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        `Failed to upload video: ${error.message || 'Unknown error'}`,
      );
    }
  }
}
