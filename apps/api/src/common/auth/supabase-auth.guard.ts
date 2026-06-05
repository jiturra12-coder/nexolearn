import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import * as jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string
    email?: string
    aud?: string
  }
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('Missing authentication token')
    }

    try {
      const secret = this.configService.get<string>('SUPABASE_JWT_SECRET')
      if (!secret) {
        throw new Error('SUPABASE_JWT_SECRET not configured')
      }

      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as Record<string, unknown>

      request.user = {
        sub: decoded.sub as string,
        email: decoded.email as string | undefined,
        aud: decoded.aud as string | undefined,
      }

      return true
    } catch (error) {
      throw new UnauthorizedException(`Token verification failed: ${(error as Error).message}`)
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null
    }

    return parts[1]
  }
}
