import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guard/jwt.guard';
import { GetUser } from './decorators/getUser.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  CreateAdminDto,
  CreateStudentDto,
  CreateTeacherDto,
} from '../auth/dto/create-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GlobalApiResponse } from 'utils/decorator/api-response.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ResendVerifyEmailDto, VerifyEmailDto } from './dto/verifyEmail.dto';
import { ResetTokenDto } from './dto/reset-token.dto';

@GlobalApiResponse()
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('create-admin')
  @ApiOperation({ summary: 'Register an admin account' })
  async CreateAdmin(@Body() dto: CreateAdminDto) {
    const data = await this.authService.create_Admin(dto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('create-student')
  @ApiOperation({ summary: 'Register a student' })
  async CreateUser(@Body() dto: CreateStudentDto) {
    const data = await this.authService.create_student(dto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('create-teacher')
  @ApiOperation({ summary: 'Register a teacher account' })
  async CreateTeacher(@Body() dto: CreateTeacherDto) {
    const data = await this.authService.create_Teacher(dto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Log into an account' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request reset link to be sent to verified email' })
  async requestPasswordReset(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(forgotPasswordDto);
    return {
      data,
      status: 'success',
    };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get Currently logged in User' })
  async getMe(@GetUser() user: any) {
    const { deletedAt, ...userWithoutDeletedAt } = user;
    return { data: userWithoutDeletedAt, status: 'success' };
  }

  @Patch('reset-password')
  @ApiOperation({ summary: 'Reset Password of a particular account' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(resetPasswordDto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify email token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmailToken(dto);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification-token')
  @ApiOperation({ summary: 'Resend email verification token' })
  async resendVerifyEmailToken(@Body() dto: ResendVerifyEmailDto) {
    return await this.authService.resendVerifyEmailToken(dto);
  }

  @Post('verify-reset-token')
  @ApiOperation({ summary: 'Verify Reset token' })
  async verifyResetToken(@Body() dto: ResetTokenDto) {
    await this.authService.verifyResetToken(dto);
    return { message: 'Token verified successfully' };
  }
}
