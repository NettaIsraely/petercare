import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

@Processor('notifications')
export class NotificationProcessor extends WorkerHost{
    private readonly logger = new Logger(NotificationProcessor.name);

    async process(job: Job<any, any, string>): Promise<void> {
        this.logger.debug(`🧑‍🍳 Worker picked up ticket: [${job.name}]`);

        switch(job.name) {
            case 'shift-reassigned-alert': {
                this.logger.warn(`📱 SIMULATING PUSH NOTIFICATION TO USER [${job.data.userId}]`);
                this.logger.warn(`MESSAGE: "${job.data.message}"`);
                break;
            }

            case 'feeding-reminder': {
                this.logger.log(`📱 SIMULATING PUSH NOTIFICATION TO USER [${job.data.userId}]`);
                this.logger.log(`MESSAGE: "${job.data.message}"`);
                break;
            }

            default: {
                this.logger.error(`Unknown job type: ${job.name}`);
            }
        }

        this.logger.debug(`✅ Finished processing ticket: [${job.name}]`);
    }
}