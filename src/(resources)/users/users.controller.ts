import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all User accounts - (Admin)' })
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
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Account role',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const result = await this.usersService.findAll({
      page,
      limit,
      search,
      role,
    });
    return {
      status: 'success',
      ...result,
    };
  }

  @Post(':id/update-profile-image')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('JWT')
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiOperation({ summary: 'Update profile image - (All)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const data = await this.usersService.updateProfileImage(id, file);
    return {
      data,
      status: 'success',
    };
  }

  @Patch(':id/status-toggle')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate or activate an account - (Admin)' })
  async deactivateUser(@Param('id') id: string) {
    const data = await this.usersService.toggleAccountStatus(id);
    return {
      data,
      status: 'success',
    };
  }

  @Delete(':id/delete')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an account - (Admin)' })
  async remove(@Param('id') id: string) {
    const data = await this.usersService.deleteAccount(id);
    return {
      data,
      status: 'success',
    };
  }

  @Put(':id/restore')
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @Roles('admin')
  @ApiOperation({ summary: 'Restore an account - (Admin)' })
  async restore(@Param('id') id: string) {
    const data = await this.usersService.restoreAccount(id);
    return {
      data,
      status: 'success',
    };
  }
}
