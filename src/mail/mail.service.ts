import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/(resources)/users/entities/user.entity';
import { EmailNotificationMetadata } from 'utils/types';

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

  async resendVerificationToken(
    email: string,
    user: User,
    token: string,
    isVerified: boolean,
  ) {
    const mailOptions = {
      to: email,
      subject: 'Verification Token Resent',
      template: './html_templates',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        token: user.verificationToken || token,
        resendVerificationMail: isVerified,
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

  /**
   * Send a custom email notification to a user
   *
   * @param email - Recipient's email address
   * @param subject - Email subject (used as title in template)
   * @param content - Main content of the notification (supports HTML)
   * @param user - User entity for personalization
   * @param metadata - Optional metadata for enhanced notifications
   *
   * Supported metadata properties:
   * - courseId: Course identifier
   * - courseName: Name of the course
   * - completedAt: When course was completed
   * - progress: Course progress percentage
   * - downloadedAt: When course was downloaded
   * - estimatedSize: Course size (formatted)
   * - actionUrl: URL for action button
   * - actionText: Text for action button
   */
  async sendCustomNotification(
    email: string,
    subject: string,
    content: string,
    user: User,
    metadata?: EmailNotificationMetadata,
  ) {
    // Calculate current year for footer copyright
    const now = new Date().getFullYear();

    const mailOptions = {
      to: email,
      subject: subject,
      template: './html_templates',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        title: subject, // Use subject as the title in the template
        content: content,
        metadata: metadata || {},
        now: now, // For copyright year in footer
        sendNotification: true,
      },
    };

    await this.mailerService.sendMail(mailOptions);
  }
}
