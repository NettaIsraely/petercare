import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase Admin is not configured. Web push notifications will be skipped.',
      );
      return;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    this.initialized = true;
    this.logger.log('Firebase Admin initialized for web push notifications.');
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  private stringifyData(data: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    );
  }

  async sendWebPush(
    token: string,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Firebase Admin is not configured.');
    }

    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data: this.stringifyData(data),
      webpush: {
        notification: {
          title,
          body,
          icon: '/apple-touch-icon.png',
        },
      },
    });
  }

  isInvalidTokenError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = (error as { code?: string }).code;
    return (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    );
  }
}
