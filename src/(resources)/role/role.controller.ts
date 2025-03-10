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
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/customDecorators/roleHandling';
import { GlobalApiResponse } from 'utils/decorator/api-response.decorator';

@GlobalApiResponse()
@Controller({ path: 'role', version: '1' })
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // @Post('seed-roles')
  // async seed() {
  //   return await this.roleService.seedRoles();
  // }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Create role' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.roleService.create(createRoleDto);
    return {
      data,
      status: 'success',
    };
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
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
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Get single role' })
  async findOne(@Param('id') id: string) {
    const data = await this.roleService.findOne(+id);
    return {
      data,
      status: 'success',
    };
  }

  @Patch(':id/update')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Update role' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const data = await this.roleService.update(+id, updateRoleDto);
    return {
      data,
      status: 'success',
    };
  }

  @Delete(':id/delete')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    return await this.roleService.remove(+id);
  }

  @Put(':id/restore')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Restore role' })
  async restore(@Param('id') id: string) {
    return await this.roleService.restore(+id);
  }
}
