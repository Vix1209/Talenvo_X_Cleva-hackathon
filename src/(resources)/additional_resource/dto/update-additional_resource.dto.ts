import { PartialType } from '@nestjs/swagger';
import { CreateAdditionalResourceDto } from './create-additional_resource.dto';

export class UpdateAdditionalResourceDto extends PartialType(CreateAdditionalResourceDto) {}
