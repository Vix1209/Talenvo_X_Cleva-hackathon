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
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guard/jwt.guard';
import { GetUser } from './customDecorators/getUser';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateAdminDto,
  CreateStudentDto,
  CreateTeacherDto,
} from 'src/auth/dto/create-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GlobalApiResponse } from '../../utils/decorator/api-response.decorator';
import { AuthGuard } from '@nestjs/passport';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ResetTokenDto } from './dto/reset-token.dto';

@GlobalApiResponse()
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('create-admin')
  @ApiOperation({ summary: 'Register an account' })
  async CreateAdmin(@Body() dto: CreateAdminDto) {
    const data = await this.authService.create_Admin(dto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('create-user')
  @ApiOperation({ summary: 'Register an account' })
  async CreateUser(@Body() dto: CreateStudentDto) {
    const data = await this.authService.create_Voter(dto);
    return {
      data,
      status: 'success',
    };
  }

  @Post('create-user')
  @ApiOperation({ summary: 'Register an account' })
  async CreateTeacher(@Body() dto: CreateTeacherDto) {
    const data = await this.authService.create_Voter(dto);
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const jwt = await this.authService.generateJwtToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}?token=${jwt}`);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify email token' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Query('email') email: string,
  ) {
    await this.authService.verifyEmailToken(dto, email);
    return { message: 'Email verified successfully' };
  }

  @Post('verify-reset-token')
  @ApiOperation({ summary: 'Verify Reset token' })
  async verifyResetToken(@Body() dto: ResetTokenDto) {
    await this.authService.verifyResetToken(dto);
    return { message: 'Token verified successfully' };
  }
}
