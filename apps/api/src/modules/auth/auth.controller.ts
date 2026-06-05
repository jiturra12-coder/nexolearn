import { Body, Controller, Post, UseGuards, Request, Get, HttpCode, HttpStatus, Version } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto'
import { SupabaseAuthGuard, AuthenticatedRequest } from '@/common/auth/supabase-auth.guard'

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signUpDto: SignUpDto): Promise<Record<string, unknown>> {
    return this.authService.signup(signUpDto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() signInDto: SignInDto): Promise<Record<string, unknown>> {
    return this.authService.login(signInDto)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<Record<string, unknown>> {
    return this.authService.refresh(refreshTokenDto)
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: AuthenticatedRequest): Record<string, string> {
    return { message: 'Logout successful', userId: req.user?.sub || 'unknown' }
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getCurrentUser(@Request() req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    return this.authService.getCurrentUser(req.user?.sub || '')
  }
}
