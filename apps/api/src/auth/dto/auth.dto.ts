import { IsEmail, IsString, MinLength, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { Role } from '@lifecode/shared';

export { Role };

export class RegisterDto {
  @IsUUID()
  tenantId: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres (Segurança SaMD)' })
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  cpf?: string;
}

export class LoginDto {
  @IsUUID()
  tenantId: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    tenantId: string;
  };
}
