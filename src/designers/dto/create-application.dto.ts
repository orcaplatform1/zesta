import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDesignerApplicationDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  brandName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password!: string;

  @IsBoolean()
  canInvoice!: boolean;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  otherCategory?: string;

  @IsString()
  @MinLength(10)
  message!: string;
}
