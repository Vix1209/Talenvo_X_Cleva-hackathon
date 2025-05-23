import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { RoleService } from './(resources)/role/role.service';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
    rawBody: true,
  });

  //Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || 'API')
    .setDescription(process.env.APP_DESCRIPTION || 'Edulite API Documentation')
    .setVersion(process.env.API_VERSION || '1.0')
    .addServer('/api/v1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  // Create Swagger document with custom options to prevent duplicate tags
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    ignoreGlobalPrefix: false,
  });

  // Post-process the document to remove duplicate controller tags
  const tagNames = new Set();
  if (document.tags) {
    // Keep only unique tags
    document.tags = document.tags.filter((tag) => {
      if (tagNames.has(tag.name)) {
        return false;
      }
      tagNames.add(tag.name);
      return true;
    });
  }

  // Process paths to ensure operations only use ApiTags and not controller names
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const operation = document.paths[path][method];

      // If using ApiTags (which adds tags), remove any controller-name-based tags
      if (operation.tags && operation.tags.length > 0) {
        // Check if there's a custom tag that matches ApiTags
        const hasApiTags = operation.tags.some(
          (tag: string | string[]) =>
            tag.includes('Course Management') ||
            tag.includes('Course Categories') ||
            tag.includes('Courses -'),
        );

        // If using ApiTags, remove the controller-name tag
        if (hasApiTags) {
          operation.tags = operation.tags.filter(
            (tag: string) => tag !== 'Course' && tag !== 'CourseController',
          );
        }
      }
    }
  }

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Set up versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Raw body parser for webhook verification
  app.use(
    bodyParser.json({
      limit: '50mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // Increase the timeout for the server
  app.use(
    (
      req: any,
      res: { setTimeout: (arg0: number) => void },
      next: () => void,
    ) => {
      res.setTimeout(15 * 60 * 1000); // 15 minutes timeout
      next();
    },
  );

  // Enable CORS with open configuration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // This enables class-transformer
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('/api/');

  try {
    SwaggerModule.setup('/api', app, document, {
      swaggerOptions: {
        useGlobalPrefix: true,
      },
    });
  } catch (error) {
    console.error('Error setting up Swagger:', error);
  }

  const environment = process.env.NODE_ENV || 'development';

  if (environment !== 'development') {
    const roleService = app.get(RoleService);
    await roleService.seedRoles();
  }

  await app.listen(process.env.PORT || 5000);
  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
}

bootstrap();
