import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
// import { GoogleStrategy } from './strategy/google.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/(resources)/users/entities/user.entity';
import { Role } from 'src/(resources)/role/entities/role.entity';
import { UsersService } from 'src/(resources)/users/users.service';
import { UsersModule } from 'src/(resources)/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

import { CloudinaryUploadService } from 'src/cloudinary/cloudinaryUpload.service';
import { Vote } from 'src/(resources)/vote/entities/vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Admin,
      Voter,
      Vote,
      Judge,
      Contestant,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    CloudinaryUploadService,
    // GoogleStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}
