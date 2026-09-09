import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Kayıt sonrası isim/soyisim değiştirilemez (siparişlerdeki kimlik bilgisiyle
// tutarlılık için) — sadece iletişim/hesap bilgileri burada düzenlenir.
export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
