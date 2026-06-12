import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';
import { User } from '../users/entities/user.entity';
import { Horse } from '../horses/entities/horse.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Feeding } from '../feedings/entities/feeding.entity';
import { Task } from '../tasks/entities/task.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { RoleRequest } from '../role-requests/entities/role-request.entity';

config({ path: join(__dirname, '../../../.env') });

// Migration CLI targets local Docker by default; set USE_CLOUD_DATABASE=true for Supabase.
if (process.env.USE_CLOUD_DATABASE !== 'true') {
  delete process.env.DATABASE_URL;
}

export default new DataSource({
  ...buildTypeOrmOptions((key) => process.env[key]),
  entities: [User, Horse, Ride, Feeding, Task, Treatment, RoleRequest],
  synchronize: false,
  migrationsRun: false,
});
