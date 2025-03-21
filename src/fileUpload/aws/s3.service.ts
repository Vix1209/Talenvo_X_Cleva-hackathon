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
  private readonly chunkSize: number = 10 * 1024 * 1024; // 10MB chunks for large files

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

  async uploadSmallVideo(
    file: Express.Multer.File,
    progressCallback?: (progress: number) => void,
  ): Promise<string> {
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
      // Call progress callback with 0% at start
      if (progressCallback) progressCallback(0);

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Call progress callback with 100% when complete
      if (progressCallback) progressCallback(100);

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
    progressCallback?: (progress: number) => void,
  ): Promise<string> {
    const key = `course/${Date.now()}-${originalFilename.replace(/\s+/g, '-')}`;

    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('File not found');
      }

      const fileSize = fs.statSync(filePath).size;

      if (fileSize > 1024 * 1024 * 500) {
        throw new BadRequestException(
          'File size exceeds the maximum limit of 500MB',
        );
      }

      // Initialize progress
      if (progressCallback) progressCallback(0);
      console.log('Starting multipart upload...');

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
      const numParts = Math.ceil(fileSize / this.chunkSize);
      const uploadedParts: { ETag: string | undefined; PartNumber: number }[] =
        [];
      let totalBytesUploaded = 0;

      console.log(
        `Total file size: ${fileSize} bytes, will be uploaded in ${numParts} parts`,
      );

      for (let i = 0; i < numParts; i++) {
        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, fileSize);
        const chunkSize = end - start;

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

        // Update progress
        totalBytesUploaded += chunkSize;
        const progressPercent = Math.round(
          (totalBytesUploaded / fileSize) * 100,
        );

        console.log(
          `Uploaded part ${i + 1}/${numParts} (${progressPercent}% complete)`,
        );

        if (progressCallback) {
          progressCallback(progressPercent);
        }
      }

      console.log('All parts uploaded, completing multipart upload...');

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
      console.log('Multipart upload completed successfully');

      // Ensure 100% progress is reported
      if (progressCallback) {
        progressCallback(100);
      }

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
    progressCallback?: (progress: number) => void,
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
          progressCallback,
        );
      }
    } else if ('path' in file) {
      return this.uploadLargeVideo(
        file.path,
        file.originalname,
        file.mimetype,
        progressCallback,
      );
    } else {
      throw new BadRequestException('Invalid file format provided');
    }
  }

  getVideoUrl(courseId: string, fileName: string): string {
    const key = `courses/${courseId}/${fileName}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
