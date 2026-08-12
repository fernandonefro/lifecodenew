import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Healthcheck')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verificação de Saúde do Serviço (Docker Healthcheck)' })
  checkHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'lifecode-api',
    };
  }
}
