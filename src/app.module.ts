import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { ErrorFilter } from './filters/error.filters';
import { UsersModule } from './(resources)/users/users.module';
import { RoleModule } from './(resources)/role/role.module';

@Module({
  imports: [UsersModule, RoleModule],
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
