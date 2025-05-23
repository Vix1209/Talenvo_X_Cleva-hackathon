import { Optional } from '@nestjs/common';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
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
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The User last name',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @ApiProperty({
    description: 'The User email',
    example: '',
  })
  @IsEmail()
  @IsNotEmpty()
  @Unique(['email'])
  email: string;

  @ApiProperty({
    description: 'The User phone number',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Phone number must be 10-11 digits without country code',
  })
  @Unique(['phoneNumber'])
  phoneNumber: string;

  @ApiProperty({
    description: 'The User country code',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{1,4}$/, {
    message: 'Country code must be 1-4 digits without + symbol',
  })
  countryCode: string;

  @ApiProperty({
    description: 'The User password',
    example: '',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
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
