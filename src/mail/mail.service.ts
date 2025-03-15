import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/(resources)/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}&email=${user.email}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Talenvo! Confirm your Email',
      template: './html_templates',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        url,
        role: user.role.name,
        sendUserWelcome: user.isVerified == false,
      },
    });
  }
}
