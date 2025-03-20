import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { FormData, File } from 'formdata-node';
import fetch from 'node-fetch';

@Injectable()
export class CloudinaryUploadService {
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
  private readonly MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos
  private readonly ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
  private readonly ALLOWED_VIDEO_FORMATS = [
    'mp4',
    'mov',
    'avi',
    'wmv',
    'webm',
    'mkv',
  ];
  private readonly cloud_name = process.env.CLOUDINARY_CLOUD_NAME || '';
  private readonly api_key = process.env.CLOUDINARY_API_KEY || '';
  private readonly api_secret = process.env.CLOUDINARY_API_SECRET || '';

  constructor() {
    cloudinary.config({
      cloud_name: this.cloud_name,
      api_key: this.api_key,
      api_secret: this.api_secret,
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
        `File size exceeds the maximum limit of 10MB. Current file size: ${(
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
   * Uploads a video file to Cloudinary with optimized settings for LMS
   * @param file The video file to upload
   * @param folder The folder path in Cloudinary
   * @param options Optional additional upload options
   * @returns Object containing video details including URLs and metadata
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder: string,
    options: {
      title?: string;
      description?: string;
      tags?: string[];
      adaptive_streaming?: boolean;
    } = {},
  ): Promise<{
    secure_url: string;
    public_id: string;
    duration: number;
    format: string;
    resource_type: string;
    bytes: number;
    width: number;
    height: number;
    streaming_url?: string;
  }> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Log additional information for debugging
    console.log(
      `File validation - Size: ${file.size}, Mimetype: ${file.mimetype}, Buffer length: ${file.buffer.length}`,
    );

    // Check for buffer existence and content
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty or invalid');
    }

    if (file.size > this.MAX_VIDEO_SIZE) {
      throw new BadRequestException(
        `File size exceeds the maximum limit of 500MB. Current file size: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`,
      );
    }

    // Check for video mimetype
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException(
        'Invalid file type. Only video files are allowed.',
      );
    }

    try {
      // For videos, we'll use truly chunked upload to avoid buffer overflow
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const uploadResult = await new Promise<any>((resolve, reject) => {
        // Configure upload options
        const uploadOptions = {
          folder,
          resource_type: 'video' as 'video',
          allowed_formats: this.ALLOWED_VIDEO_FORMATS,
          // Essential video optimizations for LMS
          eager: [
            // Adaptive bitrate streaming preset if requested
            ...(options.adaptive_streaming
              ? [{ streaming_profile: 'hd', format: 'mpd' }]
              : []),
            // Standard optimization for regular playback
            {
              format: 'mp4',
              transformation: [
                { quality: 'auto' },
                { audio_codec: 'aac' },
                { video_codec: 'h264' },
              ],
            },
          ],
          eager_async: true,
          eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL,
          // Metadata for better organization in Cloudinary
          context: {
            ...(options.title ? { title: options.title } : {}),
            ...(options.description
              ? { description: options.description }
              : {}),
          },
          ...(options.tags ? { tags: options.tags } : {}),
        };

        // Create upload stream with highWaterMark to control memory usage
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error(
                'Video upload error:',
                JSON.stringify(error, null, 2),
              );
              return reject(new Error(`Video upload failed: ${error.message}`));
            }
            if (!result) {
              return reject(
                new Error('Video upload failed: No result returned'),
              );
            }

            // If adaptive streaming was requested, add the streaming URL
            const response = {
              ...result,
              streaming_url: options.adaptive_streaming
                ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/sp_hd/${result.public_id}.mpd`
                : undefined,
            };

            resolve(response);
          },
        );

        // Process file in chunks to avoid buffer overflow
        const sendChunks = () => {
          let offset = 0;

          const sendNextChunk = () => {
            if (offset >= file.buffer.length) {
              // We're done sending chunks, end the stream
              uploadStream.end();
              return;
            }

            const chunk = file.buffer.slice(offset, offset + CHUNK_SIZE);
            offset += chunk.length;

            // Check if the uploadStream can accept more data
            const canContinue = uploadStream.write(chunk);

            if (canContinue) {
              // If the buffer isn't full, continue immediately
              process.nextTick(sendNextChunk);
            } else {
              // Wait for the 'drain' event before sending the next chunk
              uploadStream.once('drain', sendNextChunk);
            }
          };

          // Start sending chunks
          sendNextChunk();
        };

        // Begin the upload process
        sendChunks();
      });

      return uploadResult;
    } catch (error) {
      console.error('Video upload error details:', error);

      // Provide more specific error information
      const errorMessage = error.message || 'Unknown error';
      const isBufferError = errorMessage.includes('ENOBUFS');

      throw new BadRequestException(
        `Failed to upload video: ${errorMessage}${
          isBufferError
            ? ' - Video file may be too large or system memory insufficient'
            : ''
        }`,
      );
    }
  }

  /**
   * Enhanced method to handle direct upload to Cloudinary for large files with chunking
   * @param file The video file to upload
   * @param folder The folder path in Cloudinary
   * @param options Optional additional upload options
   * @returns Object containing video details including URLs and metadata
   */
  async directUploadVideo(
    file: Express.Multer.File,
    folder: string,
    options: {
      title?: string;
      description?: string;
      tags?: string[];
      adaptive_streaming?: boolean;
    } = {},
  ): Promise<{
    secure_url: string;
    public_id: string;
    duration: number;
    format: string;
    resource_type: string;
    bytes: number;
    width: number;
    height: number;
    streaming_url?: string;
  }> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check for buffer existence and content
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty or invalid');
    }

    // Log additional information for debugging
    console.log(
      `Direct upload - Size: ${file.size}, Mimetype: ${file.mimetype}`,
    );

    try {
      console.log('Starting optimized chunked upload to Cloudinary...');

      // For videos over 100MB, use the SDK's upload_stream with explicit chunking
      // This combines the reliability of the SDK with efficient memory management
      const uploadResult = await new Promise<any>((resolve, reject) => {
        // Create a unique public_id for this upload
        const uniquePublicId = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

        // Build context object
        const context: Record<string, string> = {};
        if (options.title) context.title = options.title;
        if (options.description) context.description = options.description;

        // Configure upload options with optimizations
        const uploadOptions = {
          public_id: uniquePublicId,
          folder,
          resource_type: 'video' as 'video',
          allowed_formats: this.ALLOWED_VIDEO_FORMATS,
          // Video optimizations for LMS
          eager: [
            // Adaptive bitrate streaming preset if requested
            ...(options.adaptive_streaming
              ? [{ streaming_profile: 'hd', format: 'mpd' }]
              : []),
            // Standard optimization for playback
            {
              format: 'mp4',
              transformation: [
                { quality: 'auto' },
                { audio_codec: 'aac' },
                { video_codec: 'h264' },
              ],
            },
          ],
          eager_async: true,
          // Metadata
          context,
          ...(options.tags && options.tags.length > 0
            ? { tags: options.tags }
            : {}),
          // Set higher chunk size (10MB) for faster uploads
          chunk_size: 10 * 1024 * 1024,
          // Enable multi-part upload for large files
          use_filename: true,
        };

        // Create upload stream with performance optimizations
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Upload error:', error);
              return reject(new Error(`Upload failed: ${error.message}`));
            }
            if (!result) {
              return reject(new Error('Upload failed: No result returned'));
            }

            // Build response with streaming URL if needed
            const response = {
              ...result,
              streaming_url: options.adaptive_streaming
                ? `https://res.cloudinary.com/${this.cloud_name}/video/upload/sp_hd/${result.public_id}.mpd`
                : undefined,
            };

            resolve(response);
          },
        );

        // Implement optimized chunk upload with better concurrency
        const OPTIMAL_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
        const MAX_CONCURRENT_CHUNKS = 3; // Control concurrency

        let activeUploads = 0;
        let offset = 0;
        let isCompleted = false;

        // Function to upload the next chunk
        const uploadNextChunk = async () => {
          if (isCompleted || offset >= file.buffer.length) {
            if (activeUploads === 0 && !isCompleted) {
              isCompleted = true;
              uploadStream.end();
            }
            return;
          }

          if (activeUploads >= MAX_CONCURRENT_CHUNKS) {
            // Wait until a slot is available
            return;
          }

          activeUploads++;

          // Get the next chunk
          const end = Math.min(offset + OPTIMAL_CHUNK_SIZE, file.buffer.length);
          const chunk = file.buffer.slice(offset, end);
          offset = end;

          try {
            // Write the chunk to the stream
            const canContinue = uploadStream.write(chunk);

            activeUploads--;

            // Schedule next chunks
            if (canContinue) {
              // Immediately process more chunks if stream is not full
              process.nextTick(uploadNextChunk);
              process.nextTick(uploadNextChunk);
            } else {
              // Wait for drain before uploading more
              uploadStream.once('drain', () => {
                uploadNextChunk();
                uploadNextChunk();
              });
            }

            // Check if we're done
            if (
              offset >= file.buffer.length &&
              activeUploads === 0 &&
              !isCompleted
            ) {
              isCompleted = true;
              uploadStream.end();
            }
          } catch (err) {
            console.error('Chunk upload error:', err);
            activeUploads--;

            // End the stream if we've processed all chunks
            if (
              offset >= file.buffer.length &&
              activeUploads === 0 &&
              !isCompleted
            ) {
              isCompleted = true;
              uploadStream.end();
            }
          }
        };

        // Start multiple uploads in parallel
        for (let i = 0; i < MAX_CONCURRENT_CHUNKS; i++) {
          uploadNextChunk();
        }
      });

      console.log('Chunked upload completed successfully');
      return uploadResult;
    } catch (error) {
      console.error('Video upload error details:', error);

      // Provide a more specific error message
      throw new BadRequestException(`Failed to upload video: ${error.message}`);
    }
  }
}
