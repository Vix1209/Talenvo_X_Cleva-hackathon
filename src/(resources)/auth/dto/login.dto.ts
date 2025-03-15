import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The user phone number',
    example: '',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "The user's password",
    example: '',
  })
  @IsString()
  password: string;
}
