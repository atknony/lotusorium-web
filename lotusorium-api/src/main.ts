import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);

  // Express 5 defaults the query parser to 'simple'; 'extended' (qs) is needed
  // to parse nested facet params like ?attr[scent]=lavender into objects.
  app.set('query parser', 'extended');

  // Behind a proxy/CDN, trust N hops so req.ip (used for click-IP hashing,
  // audit logs, and rate limiting) reflects the real client, not the proxy.
  const trustProxy = config.get<number>('trustProxy') ?? 0;
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.get<string>('corsOrigin'),
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  if (config.get('nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Lotusorium API')
      .setDescription('Catalog + admin backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, doc);
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(`Lotusorium API on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
