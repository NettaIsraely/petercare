import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventModifiedNotificationPreference1781268467371
  implements MigrationInterface
{
  name = 'EventModifiedNotificationPreference1781268467371';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "notify_event_modified" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "notify_event_modified"
    `);
  }
}
