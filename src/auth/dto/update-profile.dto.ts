import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'The User first name',
    example: '',
  })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The User last name',
    example: '',
  })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'The user phone number',
    example: '',
  })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'The user position',
    example: '',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    description: 'The user description',
    example: '',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The user Gender',
    example: 'male | female',
  })
  @IsOptional()
  @IsString()
  gender?: 'male' | 'female';

  @ApiProperty({
    description: 'The user address',
    example: '',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'The user address',
    example: '',
  })
  @IsOptional()
  @IsString()
  roleName?: string;
}
