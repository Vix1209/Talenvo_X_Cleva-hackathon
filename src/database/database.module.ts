import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createTypeOrmConfig,
    }),
  ],
})
export class DatabaseModule {}

// Centralized configuration function
export function createTypeOrmConfig(configService: ConfigService): any {
  const isDevelopment = configService.get('NODE_ENV') === 'development';

  if (isDevelopment) {
    console.log('Connecting to local MySQL database on MySQL Workbench');
    return {
      type: 'mysql',
      host: configService.get('MYSQL_HOST'),
      port: parseInt(configService.get('MYSQL_PORT') || '3306', 10),
      username: configService.get('MYSQL_USER'),
      password: configService.get('MYSQL_PASSWORD'),
      database: configService.get('MYSQL_DATABASE'),
      extra: {
        ssl: false,
      },
      autoLoadEntities: true,
      synchronize: configService.get('MYSQL_SYNC') === 'true',
    };
  } else {
    // Production configuration using Aiven MySQL
    const dbUrl = configService.get('DB_URL');

    if (!dbUrl) {
      throw new Error('Database URL is not defined in environment variables');
    }

    console.log(`Connecting to Cloud database`);
    return {
      type: 'mysql',
      url: dbUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      autoLoadEntities: true,
      synchronize: false,
    };
  }
}
