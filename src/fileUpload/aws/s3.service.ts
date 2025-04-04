import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  // CreateInvalidationCommand,
  // GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly cloudfrontClient: CloudFrontClient;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cloudfrontDistributionId: string;
  private readonly cloudfrontDomain: string;
  private readonly chunkSize: number = 10 * 1024 * 1024; // 10MB chunks for large files

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID') || '';
    const secretAccessKey =
      this.configService.get('AWS_SECRET_ACCESS_KEY') || '';
    this.bucket = this.configService.get('AWS_S3_BUCKET') || '';
    this.cloudfrontDistributionId =
      this.configService.get('AWS_CLOUDFRONT_DISTRIBUTION_ID') || '';
    this.cloudfrontDomain =
      this.configService.get('AWS_CLOUDFRONT_DOMAIN') || '';

    if (!this.bucket) {
      throw new BadRequestException(
        'AWS_S3_BUCKET environment variable is not set',
      );
    }

    if (!this.cloudfrontDistributionId || !this.cloudfrontDomain) {
      throw new BadRequestException(
        'CloudFront distribution ID or domain is not set',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.cloudfrontClient = new CloudFrontClient({
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
  ): Promise<{
    s3Url: string;
    cloudfrontUrl: string;
    cloudfrontStreamingUrl: string;
    key: string;
  }> {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    // For smaller files (< 100MB), use regular upload
    const key = `course/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    // Determine if we should force streaming for less-compatible formats
    const shouldForceStreamingContent = (
      mimeType: string,
      filename: string,
    ): boolean => {
      const ext = filename.split('.').pop()?.toLowerCase();

      // These formats need special handling
      if (
        ext === 'mkv' ||
        ext === 'avi' ||
        mimeType === 'video/x-matroska' ||
        mimeType === 'video/x-msvideo'
      ) {
        return true;
      }

      return false;
    };

    const forceStreaming = shouldForceStreamingContent(
      file.mimetype,
      file.originalname,
    );

    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      CacheControl: 'max-age=31536000', // Cache for 1 year
      ContentType: forceStreaming ? 'video/mp4' : file.mimetype, // Force video/mp4 for MKV files
      ContentDisposition: 'inline',
    };

    try {
      // Call progress callback with 0% at start
      if (progressCallback) progressCallback(0);

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      // Call progress callback with 100% when complete
      if (progressCallback) progressCallback(100);

      const s3Url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      const cloudfrontUrl = `https://${this.cloudfrontDomain}/${key}`;
      const cloudfrontStreamingUrl = `https://${this.cloudfrontDomain}/${key}`;

      return {
        s3Url,
        cloudfrontUrl,
        cloudfrontStreamingUrl,
        key,
      };
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
  ): Promise<{
    cloudfrontUrl: string;
    cloudfrontStreamingUrl: string;
    key: string;
  }> {
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

      // Determine if we should force streaming for less-compatible formats
      const shouldForceStreamingContent = (
        mimeType: string,
        filename: string,
      ): boolean => {
        const ext = filename.split('.').pop()?.toLowerCase();

        // These formats need special handling
        if (
          ext === 'mkv' ||
          ext === 'avi' ||
          mimeType === 'video/x-matroska' ||
          mimeType === 'video/x-msvideo'
        ) {
          return true;
        }

        return false;
      };

      const forceStreaming = shouldForceStreamingContent(
        mimeType,
        originalFilename,
      );

      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: forceStreaming ? 'video/mp4' : mimeType, // Force video/mp4 for MKV files
        // ContentType: mimeType,
        CacheControl: 'max-age=31536000', // Cache for 1 year#
        ContentDisposition: 'inline',
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

      const cloudfrontUrl = `https://${this.cloudfrontDomain}/${key}`;
      const cloudfrontStreamingUrl = `https://${this.cloudfrontDomain}/${key}`;

      return {
        cloudfrontUrl,
        cloudfrontStreamingUrl,
        key,
      };
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
  ): Promise<{
    cloudfrontUrl: string;
    cloudfrontStreamingUrl: string;
    key: string;
  }> {
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

  // Modify getVideoUrls to include a download URL
  getVideoUrls(key: string): {
    s3Url: string;
    cloudfrontUrl: string;
    cloudfrontStreamingUrl: string;
    downloadUrl: string; // New download URL
  } {
    const s3Url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    const cloudfrontUrl = `https://${this.cloudfrontDomain}/${key}`;
    const cloudfrontStreamingUrl = `https://${this.cloudfrontDomain}/${key}`;
    const downloadUrl = `https://${this.cloudfrontDomain}/${key}?response-content-disposition=attachment`;

    return {
      s3Url,
      cloudfrontUrl,
      cloudfrontStreamingUrl,
      downloadUrl,
    };
  }

  // Add this method to your S3Service
  async getDownloadUrl(key: string, filename?: string): Promise<string> {
    // Get original filename from key if not provided
    const originalFilename = filename || key.split('/').pop() || 'download';

    // Create a presigned URL for downloading
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
    });

    // Create a presigned URL that will force download (expires in 15 minutes)
    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    return presignedUrl;
  }

  // async createCloudFrontInvalidation(key: string): Promise<void> {
  //   try {
  //     const params = {
  //       DistributionId: this.cloudfrontDistributionId,
  //       InvalidationBatch: {
  //         CallerReference: Date.now().toString(),
  //         Paths: {
  //           Quantity: 1,
  //           Items: [`/${key}`],
  //         },
  //       },
  //     };

  //     const command = new CreateInvalidationCommand(params);
  //     await this.cloudfrontClient.send(command);
  //     console.log(`CloudFront invalidation created for key: ${key}`);
  //   } catch (error) {
  //     console.error('Failed to create CloudFront invalidation:', error);
  //   }
  // }

  // async getCloudFrontDistributionInfo(): Promise<any> {
  //   try {
  //     const command = new GetDistributionCommand({
  //       Id: this.cloudfrontDistributionId,
  //     });
  //     const response = await this.cloudfrontClient.send(command);
  //     return response.Distribution;
  //   } catch (error) {
  //     console.error('Failed to get CloudFront distribution info:', error);
  //     throw new BadRequestException(
  //       `Failed to get CloudFront distribution info: ${error.message}`,
  //     );
  //   }
  // }
}
