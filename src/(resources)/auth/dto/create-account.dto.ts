import { Optional } from '@nestjs/common';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';
import {
  CreateAdminProfileDto,
  CreateStudentProfileDto,
  CreateTeacherProfileDto,
} from 'src/(resources)/users/dto/update-user.dto';
import { Unique } from 'typeorm';

export class CreateUserDto {
  @ApiProperty({
    description: 'The User first name',
    example: '',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The User last name',
    example: '',
  })
  @IsString()
  lastName: string;

  @IsString()
  @ApiProperty({
    description: 'The User email',
    example: '',
  })
  @IsEmail()
  @Unique(['email'])
  email: string;

  @ApiProperty({
    description: 'The User phone number',
    example: '',
  })
  @Unique(['phoneNumber'])
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'The User password',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @Optional()
  verificationToken?: string;
}

export class CreateAdminDto extends IntersectionType(
  CreateUserDto,
  CreateAdminProfileDto,
) {}

export class CreateStudentDto extends IntersectionType(
  CreateUserDto,
  CreateStudentProfileDto,
) {}

export class CreateTeacherDto extends IntersectionType(
  CreateUserDto,
  CreateTeacherProfileDto,
) {}
