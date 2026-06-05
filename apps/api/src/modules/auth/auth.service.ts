import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/prisma/prisma.service'
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto'
import * as crypto from 'crypto'

interface SupabaseAuthResponse {
  user?: Record<string, unknown>
  session?: {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  error?: {
    message: string
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly supabaseUrl: string
  private readonly supabaseAnonKey: string

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || ''
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY') || ''

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY not configured')
    }
  }

  async signup(signUpDto: SignUpDto): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
        },
        body: JSON.stringify({
          email: signUpDto.email,
          password: signUpDto.password,
        }),
      })

      const data: SupabaseAuthResponse = await response.json()

      if (!response.ok || data.error) {
        throw new ConflictException(
          data.error?.message || 'Signup failed'
        )
      }

      if (!data.user || !data.session) {
        throw new InternalServerErrorException('Invalid Supabase response')
      }

      const userId = (data.user as Record<string, unknown>).id as string

      // Create profile in our database
      await this.prisma.profile.create({
        data: {
          id: userId,
          email: signUpDto.email,
          firstName: signUpDto.firstName || null,
          lastName: signUpDto.lastName || null,
          bio: null,
          avatarUrl: null,
          location: null,
          timezone: null,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      this.logger.log(`User registered: ${signUpDto.email}`)

      return {
        user: {
          id: userId,
          email: signUpDto.email,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
        },
      }
    } catch (error) {
      this.logger.error(`Signup error: ${(error as Error).message}`)
      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('Signup failed')
    }
  }

  async login(signInDto: SignInDto): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
        },
        body: JSON.stringify({
          email: signInDto.email,
          password: signInDto.password,
        }),
      })

      const data: SupabaseAuthResponse = await response.json()

      if (!response.ok || data.error) {
        throw new UnauthorizedException(
          data.error?.message || 'Invalid credentials'
        )
      }

      if (!data.user || !data.session) {
        throw new InternalServerErrorException('Invalid Supabase response')
      }

      const userId = (data.user as Record<string, unknown>).id as string

      // Verify profile exists
      const profile = await this.prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      })

      if (!profile) {
        throw new UnauthorizedException('User profile not found')
      }

      this.logger.log(`User logged in: ${signInDto.email}`)

      return {
        user: {
          id: userId,
          email: signInDto.email,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
        },
      }
    } catch (error) {
      this.logger.error(`Login error: ${(error as Error).message}`)
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('Login failed')
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
        },
        body: JSON.stringify({
          refresh_token: refreshTokenDto.refreshToken,
        }),
      })

      const data: SupabaseAuthResponse = await response.json()

      if (!response.ok || data.error) {
        throw new UnauthorizedException(
          data.error?.message || 'Token refresh failed'
        )
      }

      if (!data.session) {
        throw new InternalServerErrorException('Invalid Supabase response')
      }

      return {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in,
        },
      }
    } catch (error) {
      this.logger.error(`Refresh error: ${(error as Error).message}`)
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('Token refresh failed')
    }
  }

  async getCurrentUser(userId: string): Promise<Record<string, unknown>> {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          bio: true,
          avatarUrl: true,
          location: true,
          timezone: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!profile) {
        throw new UnauthorizedException('User not found')
      }

      return { user: profile }
    } catch (error) {
      this.logger.error(`Get current user error: ${(error as Error).message}`)
      throw error
    }
  }
}
