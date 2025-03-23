import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: '123456',
    description: 'The verification token sent to the user email',
  })
  @IsString()
  verificationToken: string;

  @ApiProperty({
    example: 'snkjrsc@gmail.com',
    description: 'The valid user email',
  })
  @IsEmail()
  email: string;
}
