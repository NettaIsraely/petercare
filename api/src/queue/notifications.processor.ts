import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";

@Processor('notifications')
export class NotificationProcessor extends WorkerHost{
    private readonly logger = new Logger(NotificationProcessor.name);
    
    private expo = new Expo(); 

    constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super();
  }

    async process(job: Job<any, any, string>): Promise<void> {
        this.logger.debug(`🧑‍🍳 Worker picked up ticket: [${job.name}]`);

        // 1. Look up the user to get their specific device token
        const user = await this.userRepository.findOne({ where: { id: job.data.userId } });
        if (!user || !user.expo_push_token) {
            this.logger.warn(`User ${job.data.userId} has no Expo Push Token registered. Skipping.`);
            return;
        }

        // 2. Validate that the token format is correct before sending
        if (!Expo.isExpoPushToken(user.expo_push_token)) {
            this.logger.error(`Token ${user.expo_push_token} is not a valid Expo push token`);
            return;
        }

        const messages: ExpoPushMessage[] = [];
        messages.push({
            to: user.expo_push_token,
            sound: 'default' as const, // Plays the default phone notification sound
            title: 'StableHands', // The bold title of the push notification
            body: job.data.message,
            data: { shiftType: job.data.shiftType }, // Hidden data the app can read when tapped
        });

        // 4. Fire the notification to Expo's servers
        try {
            let ticketChunk = await this.expo.sendPushNotificationsAsync(messages);
            this.logger.log(`✅ Successfully sent push notification to ${user.name}`);
        } catch (error) {
            this.logger.error(`❌ Error sending push notification:`, error);
        }
    }
}