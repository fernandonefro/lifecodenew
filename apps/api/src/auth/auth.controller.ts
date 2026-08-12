import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, Role } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    return {
      user: req.user,
      message: 'Sessão ativa e válida.',
    };
  }

  // ROTA PROTEGIDA APENAS PARA MÉDICOS / ENDOCRINOLOGISTAS (EXEMPLO DE RBAC)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MEDICO, Role.ADMIN)
  @Get('physician/dashboard-access')
  async checkPhysicianAccess(@Request() req: any) {
    return {
      status: 'AUTHORIZED',
      role: req.user.role,
      message: 'Acesso autorizado ao Portal Médico.',
    };
  }
}
