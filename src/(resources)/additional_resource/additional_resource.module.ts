import { Module } from '@nestjs/common';
import { AdditionalResourceService } from './additional_resource.service';
import { AdditionalResourceController } from './additional_resource.controller';

@Module({
  controllers: [AdditionalResourceController],
  providers: [AdditionalResourceService],
})
export class AdditionalResourceModule {}
