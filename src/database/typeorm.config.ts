import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { createTypeOrmConfig } from 'src/database/database.module';

config();

const configService = new ConfigService();

export default new DataSource({
  ...createTypeOrmConfig(configService),
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  migrationsTableName: 'migrations',
});
