import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { ErrorFilter } from './filters/error.filters';
import { UsersModule } from './(resources)/users/users.module';
import { RoleModule } from './(resources)/role/role.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CourseModule } from './(resources)/course/course.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    AuthModule,
    UsersModule,
    RoleModule,
    CourseModule,
  ],
  providers: [
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
