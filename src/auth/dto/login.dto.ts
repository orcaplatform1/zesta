import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  // Login sadece hash'e karşı doğrulama yapar — burada uzunluk kısıtı
  // register/change-password'daki (6-20) politikayı tekrarlamamalı, aksi
  // halde o aralıktaki geçerli şifrelerle (ör. 6-7 karakter) giriş
  // reddedilir. Sadece boş string'i engelliyoruz.
  @IsString()
  @MinLength(1)
  password!: string;
}
