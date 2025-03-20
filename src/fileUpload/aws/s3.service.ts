import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly chunkSize: number = 5 * 1024 * 1024; // 5MB chunks (AWS minimum)

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get('AWS_SECRET_ACCESS_KEY') || '';
    this.bucket = this.configService.get('AWS_S3_BUCKET') || '';

    if (!this.bucket) {
      throw new BadRequestException(
        'AWS_S3_BUCKET environment variable is not set',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadSmallVideo(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    // For smaller files (< 100MB), use regular upload
    const key = `course/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Failed to upload small video:', error);
      throw new BadRequestException(`Failed to upload video: ${error.message}`);
    }
  }

  async uploadLargeVideo(
    filePath: string,
    originalFilename: string,
    mimeType: string,
  ): Promise<string> {
    const key = `course/${Date.now()}-${originalFilename.replace(/\s+/g, '-')}`;

    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('File not found');
      }

      if (fs.statSync(filePath).size > 1024 * 1024 * 500) {
        throw new BadRequestException(
          'File size exceeds the maximum limit of 500MB',
        );
      }

      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
      });

      const { UploadId } = await this.s3Client.send(createCommand);

      if (!UploadId) {
        throw new Error('Failed to initialize multipart upload');
      }

      // Step 2: Upload parts
      const fileSize = fs.statSync(filePath).size;
      const numParts = Math.ceil(fileSize / this.chunkSize);
      const uploadedParts: { ETag: string | undefined; PartNumber: number }[] =
        [];

      for (let i = 0; i < numParts; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, fileSize);

        // Create a read stream for just this chunk
        const fileStream = fs.createReadStream(filePath, {
          start,
          end: end - 1,
        });

        // Read the chunk into a buffer
        const chunkBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          fileStream.on('data', (chunk) =>
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
          );
          fileStream.on('error', reject);
          fileStream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Upload this part
        const uploadPartCommand = new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId,
          PartNumber: i + 1,
          Body: chunkBuffer,
        });

        const { ETag } = await this.s3Client.send(uploadPartCommand);

        uploadedParts.push({
          ETag,
          PartNumber: i + 1,
        });
      }

      // Step 3: Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId,
        MultipartUpload: {
          Parts: uploadedParts,
        },
      });

      await this.s3Client.send(completeCommand);

      // Clean up the temporary file
      fs.unlinkSync(filePath);

      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Failed to upload large video:', error);
      throw new BadRequestException(`Failed to upload video: ${error.message}`);
    }
  }

  // Controller helper for handling file uploads based on size
  async uploadVideo(
    file:
      | Express.Multer.File
      | { path: string; originalname: string; mimetype: string },
  ): Promise<string> {
    if ('buffer' in file && file.buffer) {
      if (file.buffer.length < 100 * 1024 * 1024) {
        return this.uploadSmallVideo(file as Express.Multer.File);
      } else {
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}`);
        fs.writeFileSync(tempFilePath, file.buffer);
        return this.uploadLargeVideo(
          tempFilePath,
          file.originalname,
          file.mimetype,
        );
      }
    } else if ('path' in file) {
      return this.uploadLargeVideo(file.path, file.originalname, file.mimetype);
    } else {
      throw new BadRequestException('Invalid file format provided');
    }
  }

  getVideoUrl(courseId: string, fileName: string): string {
    const key = `courses/${courseId}/${fileName}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

// import { Injectable, BadRequestException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import {
//   S3Client,
//   PutObjectCommand,
//   CreateMultipartUploadCommand,
//   UploadPartCommand,
//   CompleteMultipartUploadCommand,
//   CompletedPart,
//   GetObjectCommand,
// } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { Readable } from 'stream';

// @Injectable()
// export class S3Service {
//   private readonly s3Client: S3Client;
//   private readonly bucket: string;
//   private readonly region: string;
//   private readonly MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
//   private readonly ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
//   private readonly ALLOWED_VIDEO_MIME_TYPES = [
//     'video/mp4',
//     'video/quicktime',
//     'video/x-msvideo',
//     'video/webm',
//     'video/x-matroska',
//   ];

//   constructor(private configService: ConfigService) {
//     this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
//     const accessKeyId =
//       this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
//     const secretAccessKey =
//       this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';
//     const bucketName = this.configService.get<string>('AWS_S3_BUCKET');

//     if (!bucketName) {
//       throw new Error('AWS_S3_BUCKET environment variable is not set');
//     }

//     this.bucket = bucketName;
//     this.s3Client = new S3Client({
//       region: this.region,
//       credentials: {
//         accessKeyId,
//         secretAccessKey,
//       },
//     });
//   }

//   async uploadVideo(
//     file: Express.Multer.File,
//     folder: string,
//   ): Promise<string> {
//     // Validate file
//     if (!file) {
//       throw new BadRequestException('No video file provided');
//     }

//     if (!file.buffer) {
//       throw new BadRequestException('File buffer is missing');
//     }

//     // Validate file type using both extension and mime type
//     const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
//     const isValidExtension =
//       fileExtension && this.ALLOWED_VIDEO_FORMATS.includes(fileExtension);
//     const isValidMimeType = this.ALLOWED_VIDEO_MIME_TYPES.includes(
//       file.mimetype,
//     );

//     if (!isValidExtension || !isValidMimeType) {
//       throw new BadRequestException(
//         `Invalid video format. Allowed formats are: ${this.ALLOWED_VIDEO_FORMATS.join(', ')}. ` +
//           `Received file type: ${file.mimetype} with extension: ${fileExtension || 'unknown'}`,
//       );
//     }

//     // Validate file size
//     if (file.size > this.MAX_VIDEO_SIZE) {
//       throw new BadRequestException(
//         `Video size exceeds the maximum limit of ${
//           this.MAX_VIDEO_SIZE / (1024 * 1024 * 1024)
//         }GB. Current size: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`,
//       );
//     }

//     const key = `${folder}/${Date.now()}-${file.originalname}`;

//     try {
//       // For files larger than 100MB, use multipart upload
//       if (file.size > 100 * 1024 * 1024) {
//         await this.multipartUpload(file, key);
//       } else {
//         // For smaller files, use regular upload
//         const command = new PutObjectCommand({
//           Bucket: this.bucket,
//           Key: key,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         });

//         await this.s3Client.send(command);
//       }

//       // Generate a pre-signed URL for accessing the file
//       // This URL will be valid for 7 days
//       const getObjectCommand = new GetObjectCommand({
//         Bucket: this.bucket,
//         Key: key,
//       });

//       const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
//         expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
//       });

//       return signedUrl;
//     } catch (error) {
//       console.error('S3 upload error:', error);
//       throw new BadRequestException(
//         `Failed to upload video: ${error.message || 'Unknown error'}`,
//       );
//     }
//   }

//   private async multipartUpload(
//     file: Express.Multer.File,
//     key: string,
//   ): Promise<void> {
//     const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
//     const parts: CompletedPart[] = [];

//     try {
//       // Initialize multipart upload
//       const createCommand = new CreateMultipartUploadCommand({
//         Bucket: this.bucket,
//         Key: key,
//         ContentType: file.mimetype,
//       });

//       const { UploadId } = await this.s3Client.send(createCommand);

//       if (!UploadId) {
//         throw new Error('Failed to initialize multipart upload');
//       }

//       const stream = Readable.from(file.buffer);
//       let partNumber = 1;
//       let chunk = await this.readChunk(stream, CHUNK_SIZE);

//       // Upload parts
//       while (chunk) {
//         const uploadCommand = new UploadPartCommand({
//           Bucket: this.bucket,
//           Key: key,
//           UploadId,
//           PartNumber: partNumber,
//           Body: chunk,
//         });

//         const { ETag } = await this.s3Client.send(uploadCommand);

//         if (!ETag) {
//           throw new Error(`Failed to upload part ${partNumber}`);
//         }

//         parts.push({
//           ETag,
//           PartNumber: partNumber,
//         });

//         partNumber++;
//         chunk = await this.readChunk(stream, CHUNK_SIZE);
//       }

//       // Complete multipart upload
//       const completeCommand = new CompleteMultipartUploadCommand({
//         Bucket: this.bucket,
//         Key: key,
//         UploadId,
//         MultipartUpload: { Parts: parts },
//       });

//       await this.s3Client.send(completeCommand);
//     } catch (error) {
//       console.error('Multipart upload error:', error);
//       throw new BadRequestException(
//         `Failed to upload video: ${error.message || 'Unknown error'}`,
//       );
//     }
//   }

//   private readChunk(
//     stream: Readable,
//     size: number,
//   ): Promise<Buffer | undefined> {
//     return new Promise((resolve, reject) => {
//       const chunks: Buffer[] = [];
//       let totalSize = 0;

//       stream.on('data', (chunk: Buffer) => {
//         chunks.push(chunk);
//         totalSize += chunk.length;

//         if (totalSize >= size) {
//           stream.pause();
//           resolve(Buffer.concat(chunks));
//         }
//       });

//       stream.on('end', () => {
//         if (chunks.length === 0) {
//           resolve(undefined);
//         } else {
//           resolve(Buffer.concat(chunks));
//         }
//       });

//       stream.on('error', reject);
//     });
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import {
//   S3Client,
//   PutObjectCommand,
//   ObjectCannedACL,
//   GetObjectCommand,
// } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { BadRequestException } from 'utils';

// @Injectable()
// export class S3Service {
//   private readonly s3Client: S3Client;
//   private readonly bucket: string;
//   private readonly region: string;

//   constructor(private configService: ConfigService) {
//     this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
//     const accessKeyId =
//       this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
//     const secretAccessKey =
//       this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';
//     const bucketName = this.configService.get<string>('AWS_S3_BUCKET');

//     if (!bucketName) {
//       throw new BadRequestException(
//         'AWS_S3_BUCKET environment variable is not set',
//       );
//     }

//     this.bucket = bucketName;
//     this.s3Client = new S3Client({
//       region: this.region,
//       credentials: {
//         accessKeyId,
//         secretAccessKey,
//       },
//     });
//   }

//   async uploadVideo(file: Express.Multer.File, folder: string) {
//     // Validate file
//     if (!file) {
//       throw new BadRequestException('No video file provided');
//     }

//     const previewResult = await this.uploadToS3(file, folder);

//     return previewResult;
//   }

//   async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
//     if (!file.buffer) {
//       throw new BadRequestException(`File buffer is missing for ${file.fieldname}`);
//     }

//     // Prepare upload params
//     const params = {
//       Bucket: this.bucket,
//       Key: `${folder}/${file.originalname}`, // Define the file path in S3
//       Body: file.buffer, // File content
//       ContentType: file.mimetype, // content type is set
//     };

//     try {
//       const command = new PutObjectCommand(params);
//       await this.s3Client.send(command);
//       return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${params.Key}`;
//     } catch (error) {
//       console.error(`Failed to upload ${file.fieldname}:`, error);
//       throw new BadRequestException(
//         `Failed to upload ${file.fieldname}, ${error.message}`,
//       );
//     }
//   }
// }
