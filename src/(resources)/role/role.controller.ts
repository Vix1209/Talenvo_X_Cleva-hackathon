import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GlobalApiResponse } from 'utils/decorator/api-response.decorator';

@GlobalApiResponse()
@ApiExcludeController()
@Controller({ path: 'admin/role', version: '1' })
@UseGuards(JwtGuard, RolesGuard)
@ApiBearerAuth('JWT')
@Roles('admin')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Create role' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.roleService.create(createRoleDto);
    return {
      data,
      status: 'success',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    const data = await this.roleService.findAll({
      page,
      limit,
      search,
    });
    return {
      ...data,
      status: 'success',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single role' })
  async findOne(@Param('id') id: string) {
    const data = await this.roleService.findOne(+id);
    return {
      data,
      status: 'success',
    };
  }

  @Patch(':id/update')
  @ApiOperation({ summary: 'Update role' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const data = await this.roleService.update(+id, updateRoleDto);
    return {
      data,
      status: 'success',
    };
  }

  @Delete(':id/delete')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    return await this.roleService.remove(+id);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restore role' })
  async restore(@Param('id') id: string) {
    return await this.roleService.restore(+id);
  }
}
