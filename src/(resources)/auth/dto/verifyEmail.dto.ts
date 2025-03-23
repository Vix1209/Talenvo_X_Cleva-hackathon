import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: '123456',
    description: 'The verification token sent to the user email',
  })
  @IsString()
  @IsNotEmpty()
  verificationToken: string;

  @ApiProperty({
    example: 'snkjrsc@gmail.com',
    description: 'The valid user email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResendVerifyEmailDto {
  @ApiProperty({
    example: 'snkjrsc@gmail.com',
    description: 'The valid user email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
