import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The User first name',
    example: '',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The User last name',
    example: '',
  })
  @IsString()
  @IsOptional()
  description: string;
}
