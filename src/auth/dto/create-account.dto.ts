import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';
import { Role } from 'src/(resources)/role/entities/role.entity';

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
  })n
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The User phone number',
    example: '',
  })
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

  @ApiProperty({
    description: 'The Account Role',
    example: {
      name: '',
    },
  })
  role: Role;
}
