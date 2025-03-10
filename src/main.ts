import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { RoleService } from './(resources)/role/role.service'; // Adjust the import path as necessary

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || 'API')
    .setDescription(
      process.env.APP_DESCRIPTION || 'Sketch2Finish API Documentation',
    )
    .setVersion(process.env.API_VERSION || '1.0')
    .addServer('/api/v1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: false,
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // This enables class-transformer
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('/api/');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  try {
    SwaggerModule.setup('/api', app, document, {
      swaggerOptions: {
        useGlobalPrefix: true,
      },
    });
  } catch (error) {
    console.error('Error setting up Swagger:', error);
  }

  // Get an instance of RoleService and call seedRoles
  const roleService = app.get(RoleService);
  await roleService.seedRoles();

  await app.listen(process.env.PORT || 5000);
  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
}

bootstrap();
