import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança com Helmet e CORS
  app.use(helmet());
  app.enableCors({ origin: '*' });

  // Prefixo Global da API
  app.setGlobalPrefix('api/v1');

  // Pipe Global de Validação baseado nos Schemas Zod do @lifecode/shared
  app.useGlobalPipes(new ZodValidationPipe());

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
