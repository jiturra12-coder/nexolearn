import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Request, Response } from 'express'

export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  message?: string
  data?: T
  timestamp: string
  path: string
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    const timestamp = new Date().toISOString()
    const path = request.url
    const statusCode = response.statusCode

    return next.handle().pipe(
      map((data: T) => ({
        success: statusCode >= 200 && statusCode < 300,
        statusCode,
        data,
        timestamp,
        path,
      })),
    )
  }
}
