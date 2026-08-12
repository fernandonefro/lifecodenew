import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(private jwtService: JwtService) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 1. Verifica se já existe um usuário cadastrado com o mesmo e-mail
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado na plataforma.');
    }

    // 2. Hash seguro de senha usando bcrypt com cost factor 12 (Requisito LGPD/SaMD)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 3. Cria o usuário com o vínculo de tenant e papel RBAC
    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role as any,
        cpf: dto.cpf,
      },
    });

    // 4. Gera os tokens JWT de acesso e refresh
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // 1. Busca o usuário por e-mail
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.tenantId !== dto.tenantId) {
      throw new UnauthorizedException('Credenciais inválidas ou Tenant incorreto.');
    }

    // 2. Valida o hash da senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 3. Retorna os tokens JWT
    return this.generateTokens(user);
  }

  private async generateTokens(user: any): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
