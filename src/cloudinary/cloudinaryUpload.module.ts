// src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryUploadService } from './cloudinaryUpload.service';

@Module({
  providers: [CloudinaryUploadService],
  exports: [CloudinaryUploadService],
})
export class CloudinaryModule {}
