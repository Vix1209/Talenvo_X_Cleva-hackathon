import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
// import { CreateUserDto } from '../auth/dto/create-account.dto';
// import { User } from 'src/(resources)/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
}
