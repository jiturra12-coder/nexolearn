import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const timestamp = new Date().toISOString()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let errors: unknown[] | undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as Record<string, unknown>).message as string || message
        errors = (exceptionResponse as Record<string, unknown>).error as unknown[] | undefined
      } else {
        message = exceptionResponse as string
      }
    } else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST
      message = 'Bad request'
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(`${request.method} ${request.url}`, exception.stack)
    }

    const errorResponse = {
      statusCode: status,
      timestamp,
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    }

    this.logger.error(`${request.method} ${request.url} - ${status}`, errorResponse)

    response.status(status).json(errorResponse)
  }
}
