import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança com Helmet e CORS
  app.use(helmet());

  // CORS restrito a um allowlist (nunca '*' — expunha a API a qualquer origem).
  // Origens configuráveis via CORS_ALLOWED_ORIGINS (lista separada por vírgula);
  // default cobre o portal Next.js (3000/3001) e o Expo web (19006) em dev.
  const allowedOrigins = (
    process.env.CORS_ALLOWED_ORIGINS ??
    'http://localhost:3000,http://localhost:3001,http://localhost:19006'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Prefixo Global da API
  app.setGlobalPrefix('api/v1');

  // Pipe Global de Validação: aplica os decorators class-validator dos DTOs.
  // (O ZodValidationPipe anterior só agia sobre DTOs criados via createZodDto —
  //  proibido no projeto por TS2509 — então não validava nada em runtime.)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configuração da Documentação Swagger/OpenAPI 3.0
  const config = new DocumentBuilder()
    .setTitle('Lifecode Platform API')
    .setDescription('Especificação oficial dos contratos de serviços da plataforma de gestão do diabetes.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Tenant-ID' }, 'TenantHeader')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Endpoint visual do Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Lifecode API rodando na porta ${port}`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
}

bootstrap();
