import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from "../firebase/firebase.service";

@Processor('notifications')
export class NotificationProcessor extends WorkerHost{
    private readonly logger = new Logger(NotificationProcessor.name);
    private expo = new Expo(); 
    private transporter: nodemailer.Transporter;

    constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private configService: ConfigService,
    private readonly firebaseService: FirebaseService,
    ) {
        super();
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('EMAIL_HOST'),
            port: this.configService.get<number>('EMAIL_PORT'),
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASSWORD')
            }
        });
    }

    private async clearPushToken(user: User): Promise<void> {
        user.expo_push_token = undefined;
        await this.userRepository.save(user);
    }

    async process(job: Job<any, any, string>): Promise<void> {
        this.logger.debug(`🧑‍🍳 Worker picked up ticket: [${job.name}]`);

        switch (job.name) {
            case 'password-reset-email': {
                // ==========================================
                // BELT 1: EMAIL NOTIFICATIONS
                // ==========================================
                this.logger.log(`📧 Sending OTP code email to [${job.data.email}]`);
                        
                        await this.transporter.sendMail({
                            from: '"StableHands Support" <noreply@stablehands.app>',
                            to: job.data.email,
                            subject: 'Your Password Reset Code',
                            text: `Hello ${job.data.name},\n\nSomeone requested a password reset for your account. If this was you, please enter the following 6-digit code in the app to reset your password:\n\n${job.data.token}\n\nThis code will expire in 1 hour. If you did not request this, please ignore this email.`,
                        });
                        
                        this.logger.log(`✅ OTP email sent!`);
                        break;
                        }

            default: {
                // ==========================================
                // BELT 2: PUSH NOTIFICATIONS (Expo + Firebase Web)
                // ==========================================
                const user = await this.userRepository.findOne({ where: { id: job.data.userId } });
                
                if (!user || !user.expo_push_token) {
                this.logger.warn(`User ${job.data.userId} has no push token registered. Skipping.`);
                return;
                }

                const notificationData = job.data.data ?? (
                  job.data.shiftType ? { shiftType: job.data.shiftType } : {}
                );
                const title = 'StableHands';
                const body = job.data.message;

                if (Expo.isExpoPushToken(user.expo_push_token)) {
                const messages: ExpoPushMessage[] = [];
                messages.push({
                to: user.expo_push_token,
                sound: 'default' as const, 
                title, 
                body,
                data: notificationData,
                });

                try {
                await this.expo.sendPushNotificationsAsync(messages);
                this.logger.log(`✅ Successfully sent Expo push notification to ${user.name}`);
                } catch (error) {
                this.logger.error(`❌ Error sending Expo push notification:`, error);
                }
                return;
                }

                if (!this.firebaseService.isConfigured()) {
                this.logger.error(
                  `Token for user ${user.id} is not an Expo token and Firebase Admin is not configured.`,
                );
                return;
                }

                try {
                await this.firebaseService.sendWebPush(
                  user.expo_push_token,
                  title,
                  body,
                  notificationData,
                );
                this.logger.log(`✅ Successfully sent web push notification to ${user.name}`);
                } catch (error) {
                if (this.firebaseService.isInvalidTokenError(error)) {
                  this.logger.warn(`Clearing invalid web push token for user ${user.id}`);
                  await this.clearPushToken(user);
                  return;
                }

                this.logger.error(`❌ Error sending web push notification:`, error);
                }
                break;
            }
        }
    }
}
