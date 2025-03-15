import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/(resources)/users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User, token: string, isVerified: boolean) {
    // const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}&email=${user.email}`;
    if (user.role.name === 'admin') {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Edulite! Confirm your Email',
        template: './html_templates',
        context: {
          name: `${user.firstName} ${user.lastName}`,
          token: token,
          sendUserWelcomeAdmin: isVerified,
        },
      });
    } else if (user.role.name === 'student') {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Edulite! Confirm your Email',
        template: './html_templates',
        context: {
          name: `${user.firstName} ${user.lastName}`,
          token: token,
          sendUserWelcomeStudent: isVerified,
        },
      });
    } else if (user.role.name === 'teacher') {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Edulite! Confirm your Email',
        template: './html_templates',
        context: {
          name: `${user.firstName} ${user.lastName}`,
          token: token,
          sendUserWelcomeTeacher: isVerified,
        },
      });
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const mailOptions = {
      to: email,
      subject: 'Password Token Sent',
      template: './html_templates',
      context: {
        resetToken: resetToken,
        email: email,
      },
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendPasswordAfterVerifyingEmail(
    email: string,
    user: User,
    isVerified: boolean,
  ) {
    const mailOptions = {
      to: email,
      subject: 'Email Verified',
      template: './html_templates',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        sendVerificationMail: isVerified,
      },
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendResetTokenConfirmation(
    email: string,
    user: User,
    isVerified: boolean,
  ) {
    const mailOptions = {
      to: email,
      subject: 'Password Reset',
      template: './html_templates',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        sendResetMail: isVerified,
      },
    };

    await this.mailerService.sendMail(mailOptions);
  }
}
