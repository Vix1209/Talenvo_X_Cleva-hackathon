import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ResetTokenDto {
  @ApiProperty({
    example: '123456',
    description: 'The Reset token sent to the user email',
  })
  @IsString()
  reference: string;

  @ApiProperty({
    example: '',
    description: 'The Reset token sent to the user email',
  })
  @IsString()
  @IsEmail()
  email: string;
}
