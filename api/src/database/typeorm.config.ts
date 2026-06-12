import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';

type EnvGetter = (key: string) => string | undefined;

export function buildTypeOrmOptions(get: EnvGetter): DataSourceOptions {
  const nodeEnv = get('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';
  const databaseUrl = get('DATABASE_URL');
  const migrations = [join(__dirname, '../migrations/*{.ts,.js}')];

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      synchronize: !isProduction,
      migrations,
      migrationsRun: isProduction,
    };
  }

  return {
    type: 'postgres',
    host: get('DB_HOST') ?? 'localhost',
    port: Number(get('DB_PORT') ?? 5432),
    username: get('DB_USERNAME') ?? 'postgres',
    password: get('DB_PASSWORD') ?? '',
    database: get('DB_NAME') ?? 'postgres',
    synchronize: !isProduction,
    migrations,
    migrationsRun: isProduction,
  };
}
