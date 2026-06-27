import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import { FirebaseService } from "../firebase/firebase.service";
import { EmailService } from "../email/email.service";

@Processor('notifications')
export class NotificationProcessor extends WorkerHost{
    private readonly logger = new Logger(NotificationProcessor.name);
    private expo = new Expo();

    constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    ) {
        super();
    }

    private async clearPushToken(user: User): Promise<void> {
        user.expo_push_token = undefined;
        await this.userRepository.save(user);
    }

    async process(job: Job<any, any, string>): Promise<void> {
        this.logger.debug(`🧑‍🍳 Worker picked up ticket: [${job.name}]`);

        switch (job.name) {
            case 'password-reset-email': {
                if (!this.emailService.isConfigured()) {
                    this.logger.error(
                        `Cannot send password reset email to [${job.data.email}]: email is not configured.`,
                    );
                    throw new Error('Email is not configured.');
                }

                this.logger.log(`📧 Sending OTP code email to [${job.data.email}]`);

                try {
                    const result = await this.emailService.sendPasswordResetEmail(
                        job.data.email,
                        job.data.name,
                        job.data.token,
                    );
                    this.logger.log(
                        `✅ OTP email sent to [${job.data.email}] messageId=${result.messageId ?? 'unknown'}`,
                    );
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : 'Unknown email error';
                    this.logger.error(
                        `❌ Failed to send OTP email to [${job.data.email}]: ${message}`,
                    );
                    throw error;
                }
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
                const title = 'Peter Care';
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
