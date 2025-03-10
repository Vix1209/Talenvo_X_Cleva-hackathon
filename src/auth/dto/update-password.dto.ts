import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'The user current password',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'The user new password',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;
}
