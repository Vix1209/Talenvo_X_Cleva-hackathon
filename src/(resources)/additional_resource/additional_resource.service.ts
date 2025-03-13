import { Injectable } from '@nestjs/common';
import { CreateAdditionalResourceDto } from './dto/create-additional_resource.dto';
import { UpdateAdditionalResourceDto } from './dto/update-additional_resource.dto';

@Injectable()
export class AdditionalResourceService {
  create(createAdditionalResourceDto: CreateAdditionalResourceDto) {
    return 'This action adds a new additionalResource';
  }

  findAll() {
    return `This action returns all additionalResource`;
  }

  findOne(id: number) {
    return `This action returns a #${id} additionalResource`;
  }

  update(id: number, updateAdditionalResourceDto: UpdateAdditionalResourceDto) {
    return `This action updates a #${id} additionalResource`;
  }

  remove(id: number) {
    return `This action removes a #${id} additionalResource`;
  }
}
