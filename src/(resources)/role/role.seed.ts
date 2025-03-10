import { NestFactory } from '@nestjs/core';
import { RoleModule } from './role.module';
import { RoleService } from './role.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables explicitly
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(RoleModule, {
    // Disable strict app initialization to prevent blocking on DB connection
    abortOnError: false,
  });

  try {
    const roleService = app.get(RoleService);
    await roleService.seedRoles();
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error; // Re-throw to ensure non-zero exit code
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
