import { IsString, MinLength } from 'class-validator';

// Admin girişi e-posta formatı zorunlu kılmıyor — kullanıcı adı ("admin")
// yeterli. Müşteri girişi (LoginDto) ayrı, orada @IsEmail zorunlu kalıyor.
export class AdminLoginDto {
  @IsString()
  @MinLength(1)
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
