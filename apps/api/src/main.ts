import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { Logger as WinstonLogger } from 'winston'
import { createLogger } from './common/logger/logger.service'

async function bootstrap(): Promise<void> {
  const logger = createLogger('Bootstrap')

  try {
    const app = await NestFactory.create(AppModule, {
      logger: false,
    })

    const configService = app.get(ConfigService)

    // Enable versioning
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'api/v',
    })

    // Enable CORS
    app.enableCors({
      origin: configService.get<string[]>('CORS_ORIGINS') ?? ['http://localhost:3000'],
      credentials: true,
    })

    // Global pipes for validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )

    // Global filters and interceptors
    app.useGlobalFilters(new HttpExceptionFilter(logger))
    app.useGlobalInterceptors(new ResponseInterceptor())

    const port = configService.get<number>('PORT') ?? 3001
    const environment = configService.get<string>('NODE_ENV') ?? 'development'

    await app.listen(port, '0.0.0.0')

    logger.info(`Application is running on port ${port} (${environment})`)
  } catch (error) {
    logger.error('Bootstrap error', error)
    process.exit(1)
  }
}

bootstrap()
