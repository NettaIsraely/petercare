import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationPreferencesAndIncompleteAlerts1781268467370
  implements MigrationInterface
{
  name = 'NotificationPreferencesAndIncompleteAlerts1781268467370';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feedings"
      ADD COLUMN IF NOT EXISTS "incomplete_assignee_alert_sent_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "incomplete_broadcast_alert_sent_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'feedings' AND column_name = 'incomplete_alert_sent_at'
        ) THEN
          UPDATE "feedings"
          SET
            "incomplete_broadcast_alert_sent_at" = "incomplete_alert_sent_at",
            "incomplete_assignee_alert_sent_at" = "incomplete_alert_sent_at"
          WHERE "incomplete_alert_sent_at" IS NOT NULL
            AND "incomplete_broadcast_alert_sent_at" IS NULL;

          ALTER TABLE "feedings" DROP COLUMN "incomplete_alert_sent_at";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "push_notifications_enabled" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_feeding_reminders" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_shift_reassigned" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_unassigned_feeding" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_feeding_incomplete_assignee" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_feeding_incomplete_broadcast" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_task_deadlines" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_role_requests" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "notify_role_request_resolved" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "push_notifications_enabled",
      DROP COLUMN IF EXISTS "notify_feeding_reminders",
      DROP COLUMN IF EXISTS "notify_shift_reassigned",
      DROP COLUMN IF EXISTS "notify_unassigned_feeding",
      DROP COLUMN IF EXISTS "notify_feeding_incomplete_assignee",
      DROP COLUMN IF EXISTS "notify_feeding_incomplete_broadcast",
      DROP COLUMN IF EXISTS "notify_task_deadlines",
      DROP COLUMN IF EXISTS "notify_role_requests",
      DROP COLUMN IF EXISTS "notify_role_request_resolved"
    `);

    await queryRunner.query(`
      ALTER TABLE "feedings"
      ADD COLUMN IF NOT EXISTS "incomplete_alert_sent_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      UPDATE "feedings"
      SET "incomplete_alert_sent_at" = "incomplete_broadcast_alert_sent_at"
      WHERE "incomplete_broadcast_alert_sent_at" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "feedings"
      DROP COLUMN IF EXISTS "incomplete_assignee_alert_sent_at",
      DROP COLUMN IF EXISTS "incomplete_broadcast_alert_sent_at"
    `);
  }
}
