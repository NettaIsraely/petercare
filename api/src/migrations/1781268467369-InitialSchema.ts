import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781268467369 implements MigrationInterface {
    name = 'InitialSchema1781268467369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('OWNER', 'CAREGIVER', 'GUEST')`);
        await queryRunner.query(`CREATE TYPE "public"."users_profile_color_enum" AS ENUM('blue', 'green', 'red', 'purple', 'brown', 'orange', 'gray', 'cream')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'GUEST', "display_order" integer NOT NULL DEFAULT '0', "morning_alert_time" TIME NOT NULL DEFAULT '08:00:00', "evening_alert_time" TIME NOT NULL DEFAULT '18:00:00', "timezone" character varying(64) NOT NULL DEFAULT 'Asia/Jerusalem', "profile_color" "public"."users_profile_color_enum", "expo_push_token" character varying, "reset_password_token" character varying, "reset_password_expires" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."horses_color_enum" AS ENUM('white', 'brown', 'black', 'baby')`);
        await queryRunner.query(`CREATE TABLE "horses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(256) NOT NULL, "color" "public"."horses_color_enum" NOT NULL DEFAULT 'brown', "last_shoeing_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2f98809688092c22977eb638c30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "comments" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "primary_rider_id" uuid, CONSTRAINT "PK_ca6f62fc1e999b139c7f28f07fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."feedings_shift_type_enum" AS ENUM('MORNING', 'EVENING')`);
        await queryRunner.query(`CREATE TYPE "public"."feedings_feeding_status_enum" AS ENUM('UNASSIGNED', 'ASSIGNED', 'COMPLETE')`);
        await queryRunner.query(`CREATE TABLE "feedings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "schedule_date" date NOT NULL, "shift_type" "public"."feedings_shift_type_enum" NOT NULL, "feeding_status" "public"."feedings_feeding_status_enum" NOT NULL DEFAULT 'UNASSIGNED', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "unassigned_night_alert_sent_at" TIMESTAMP WITH TIME ZONE, "incomplete_alert_sent_at" TIMESTAMP WITH TIME ZONE, "assigned_user_id" uuid, CONSTRAINT "UQ_9542cb5f8dc056b4f068e68e297" UNIQUE ("schedule_date", "shift_type"), CONSTRAINT "PK_6dc55ab0f8c2de8fd695022ff4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(300) NOT NULL, "deadline" date, "comments" character varying, "is_complete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deadline_reminder_sent_at" TIMESTAMP WITH TIME ZONE, "assigned_user_id" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treatments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "duration_minutes" integer, "date" date NOT NULL DEFAULT ('now'::text)::date, "is_complete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_133f26d52c70b9fa3c2dbb3c89e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."role_requests_requested_role_enum" AS ENUM('OWNER', 'CAREGIVER', 'GUEST')`);
        await queryRunner.query(`CREATE TYPE "public"."role_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'DENIED')`);
        await queryRunner.query(`CREATE TABLE "role_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requested_role" "public"."role_requests_requested_role_enum" NOT NULL, "status" "public"."role_requests_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "reviewed_by_id" uuid, CONSTRAINT "PK_32873821a9e1122603cc2fb86a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ride_additional_riders" ("ridesId" uuid NOT NULL, "usersId" uuid NOT NULL, CONSTRAINT "PK_4d8aca66e1b6f221d430da7ca41" PRIMARY KEY ("ridesId", "usersId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dab6908f165de00f3668bc8210" ON "ride_additional_riders"  ("ridesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_659230c7235caf9ed4e407cebf" ON "ride_additional_riders"  ("usersId") `);
        await queryRunner.query(`CREATE TABLE "ride_horses" ("ridesId" uuid NOT NULL, "horsesId" uuid NOT NULL, CONSTRAINT "PK_0173b082724bb9350464cdfea2b" PRIMARY KEY ("ridesId", "horsesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0fff8cd0ec5cc0874a93563557" ON "ride_horses"  ("ridesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5e95520b47280d489e28d8e685" ON "ride_horses"  ("horsesId") `);
        await queryRunner.query(`CREATE TABLE "treatment_horses" ("treatmentsId" uuid NOT NULL, "horsesId" uuid NOT NULL, CONSTRAINT "PK_48ea4389b5ea5268ca20f6a6d1f" PRIMARY KEY ("treatmentsId", "horsesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0eccf2274988925ac5e87d0243" ON "treatment_horses"  ("treatmentsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd4ed654ea27cb813ac4945324" ON "treatment_horses"  ("horsesId") `);
        await queryRunner.query(`ALTER TABLE "rides" ADD CONSTRAINT "FK_2cac911fed623b1c01cc56e8d2c" FOREIGN KEY ("primary_rider_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedings" ADD CONSTRAINT "FK_4a805aa60633149514eba759d31" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_327d5ce9cd59770b274f8c3579f" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treatments" ADD CONSTRAINT "FK_965fbef2aabcfa1e506119b67f5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_requests" ADD CONSTRAINT "FK_03f8a559ca73ddd3bbf6412a389" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_requests" ADD CONSTRAINT "FK_fd5e90728a2dbef39922fd71165" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ride_additional_riders" ADD CONSTRAINT "FK_dab6908f165de00f3668bc82107" FOREIGN KEY ("ridesId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ride_additional_riders" ADD CONSTRAINT "FK_659230c7235caf9ed4e407cebfd" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ride_horses" ADD CONSTRAINT "FK_0fff8cd0ec5cc0874a935635574" FOREIGN KEY ("ridesId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ride_horses" ADD CONSTRAINT "FK_5e95520b47280d489e28d8e6856" FOREIGN KEY ("horsesId") REFERENCES "horses"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "treatment_horses" ADD CONSTRAINT "FK_0eccf2274988925ac5e87d02435" FOREIGN KEY ("treatmentsId") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "treatment_horses" ADD CONSTRAINT "FK_dd4ed654ea27cb813ac49453247" FOREIGN KEY ("horsesId") REFERENCES "horses"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treatment_horses" DROP CONSTRAINT "FK_dd4ed654ea27cb813ac49453247"`);
        await queryRunner.query(`ALTER TABLE "treatment_horses" DROP CONSTRAINT "FK_0eccf2274988925ac5e87d02435"`);
        await queryRunner.query(`ALTER TABLE "ride_horses" DROP CONSTRAINT "FK_5e95520b47280d489e28d8e6856"`);
        await queryRunner.query(`ALTER TABLE "ride_horses" DROP CONSTRAINT "FK_0fff8cd0ec5cc0874a935635574"`);
        await queryRunner.query(`ALTER TABLE "ride_additional_riders" DROP CONSTRAINT "FK_659230c7235caf9ed4e407cebfd"`);
        await queryRunner.query(`ALTER TABLE "ride_additional_riders" DROP CONSTRAINT "FK_dab6908f165de00f3668bc82107"`);
        await queryRunner.query(`ALTER TABLE "role_requests" DROP CONSTRAINT "FK_fd5e90728a2dbef39922fd71165"`);
        await queryRunner.query(`ALTER TABLE "role_requests" DROP CONSTRAINT "FK_03f8a559ca73ddd3bbf6412a389"`);
        await queryRunner.query(`ALTER TABLE "treatments" DROP CONSTRAINT "FK_965fbef2aabcfa1e506119b67f5"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_327d5ce9cd59770b274f8c3579f"`);
        await queryRunner.query(`ALTER TABLE "feedings" DROP CONSTRAINT "FK_4a805aa60633149514eba759d31"`);
        await queryRunner.query(`ALTER TABLE "rides" DROP CONSTRAINT "FK_2cac911fed623b1c01cc56e8d2c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd4ed654ea27cb813ac4945324"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0eccf2274988925ac5e87d0243"`);
        await queryRunner.query(`DROP TABLE "treatment_horses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e95520b47280d489e28d8e685"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0fff8cd0ec5cc0874a93563557"`);
        await queryRunner.query(`DROP TABLE "ride_horses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_659230c7235caf9ed4e407cebf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dab6908f165de00f3668bc8210"`);
        await queryRunner.query(`DROP TABLE "ride_additional_riders"`);
        await queryRunner.query(`DROP TABLE "role_requests"`);
        await queryRunner.query(`DROP TYPE "public"."role_requests_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_requests_requested_role_enum"`);
        await queryRunner.query(`DROP TABLE "treatments"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "feedings"`);
        await queryRunner.query(`DROP TYPE "public"."feedings_feeding_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."feedings_shift_type_enum"`);
        await queryRunner.query(`DROP TABLE "rides"`);
        await queryRunner.query(`DROP TABLE "horses"`);
        await queryRunner.query(`DROP TYPE "public"."horses_color_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_profile_color_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
