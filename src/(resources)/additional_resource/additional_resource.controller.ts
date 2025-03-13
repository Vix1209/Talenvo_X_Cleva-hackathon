import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdditionalResourceService } from './additional_resource.service';
import { CreateAdditionalResourceDto } from './dto/create-additional_resource.dto';
import { UpdateAdditionalResourceDto } from './dto/update-additional_resource.dto';

@Controller('additional-resource')
export class AdditionalResourceController {
  constructor(private readonly additionalResourceService: AdditionalResourceService) {}

  @Post()
  create(@Body() createAdditionalResourceDto: CreateAdditionalResourceDto) {
    return this.additionalResourceService.create(createAdditionalResourceDto);
  }

  @Get()
  findAll() {
    return this.additionalResourceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.additionalResourceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdditionalResourceDto: UpdateAdditionalResourceDto) {
    return this.additionalResourceService.update(+id, updateAdditionalResourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.additionalResourceService.remove(+id);
  }
}
