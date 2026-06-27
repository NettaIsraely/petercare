import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  buildNodemailerTransportOptions,
  EmailSettings,
  getEmailSettings,
} from './email.config';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private settings: EmailSettings | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.settings = getEmailSettings((key) =>
      this.configService.get<string>(key),
    );

    if (!this.settings) {
      const message =
        'Email is not configured — password reset emails will fail. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD.';

      if (this.configService.get<string>('NODE_ENV') === 'production') {
        this.logger.error(message);
      } else {
        this.logger.warn(message);
      }
      return;
    }

    this.transporter = nodemailer.createTransport(
      buildNodemailerTransportOptions(this.settings),
    );

    try {
      await this.transporter.verify();
      this.logger.log(
        `Email SMTP verified (${this.settings.host}:${this.settings.port})`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(
        `Email SMTP verification failed (${this.settings.host}:${this.settings.port}): ${message}`,
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.settings !== null;
  }

  getFromAddress(): string {
    return this.settings?.from ?? '"StableHands Support" <noreply@stablehands.app>';
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<nodemailer.SentMessageInfo> {
    if (!this.transporter) {
      throw new Error('Email is not configured.');
    }

    return this.transporter.sendMail({
      from: this.getFromAddress(),
      to: email,
      subject: 'Your Password Reset Code',
      text: `Hello ${name},\n\nSomeone requested a password reset for your PeterCare account. If this was you, please enter the following 6-digit code in the app to reset your password:\n\n${token}\n\nThis code will expire in 1 hour. If you did not request this, please ignore this email.`,
    });
  }
}
