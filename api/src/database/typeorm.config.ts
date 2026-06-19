import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';

type EnvGetter = (key: string) => string | undefined;

export function usesLocalDatabase(get: EnvGetter): boolean {
  if (get('USE_LOCAL_DATABASE') === 'true') {
    return true;
  }
  return !get('DATABASE_URL');
}

export function getDatabaseTargetLabel(get: EnvGetter): string {
  if (usesLocalDatabase(get)) {
    const host = get('DB_HOST') ?? 'localhost';
    const port = get('DB_PORT') ?? '5432';
    const database = get('DB_NAME') ?? 'postgres';
    return `local ${database}@${host}:${port}`;
  }
  return 'cloud DATABASE_URL';
}

export function buildTypeOrmOptions(get: EnvGetter): DataSourceOptions {
  const nodeEnv = get('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';
  const databaseUrl = get('DATABASE_URL');
  const migrations = [join(__dirname, '../migrations/*{.ts,.js}')];

  if (databaseUrl && !usesLocalDatabase(get)) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      synchronize: false,
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
