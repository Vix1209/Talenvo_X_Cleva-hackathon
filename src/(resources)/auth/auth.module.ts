import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/(resources)/users/entities/user.entity';
import { Role } from 'src/(resources)/role/entities/role.entity';
import { UsersService } from 'src/(resources)/users/users.service';
import { UsersModule } from 'src/(resources)/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

import { CloudinaryUploadService } from 'src/cloudinary/cloudinaryUpload.service';
import {
  AdminProfile,
  StudentProfile,
  TeacherProfile,
} from 'src/(resources)/users/entities/user-profile.entity';
import { MailModule } from 'src/mail/mail.module';
import { RolesGuard } from './guard/role.guard';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      AdminProfile,
      StudentProfile,
      TeacherProfile,
    ]),
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    NotificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    CloudinaryUploadService,
    RolesGuard,
  ],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
