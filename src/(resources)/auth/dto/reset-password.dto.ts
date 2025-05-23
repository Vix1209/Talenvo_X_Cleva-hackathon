import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @ApiProperty({
    description: 'The user new password',
    example: '',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The user new password',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
