import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

export class CheckoutDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  city!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @MinLength(5)
  addressLine!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  // Fatura bilgileri — bireysel: TC kimlik no (iyzico zorunlu kılıyor),
  // kurumsal: unvan/vergi no/vergi dairesi.
  @IsOptional()
  @IsIn(['individual', 'corporate'])
  invoiceType?: 'individual' | 'corporate' = 'individual';

  @ValidateIf((o) => (o.invoiceType ?? 'individual') === 'individual')
  @Matches(/^\d{11}$/, { message: 'TC Kimlik No 11 haneli olmalı' })
  identityNumber?: string;

  @ValidateIf((o) => o.invoiceType === 'corporate')
  @IsString()
  @MinLength(2)
  companyName?: string;

  @ValidateIf((o) => o.invoiceType === 'corporate')
  @Matches(/^\d{10}$/, { message: 'Vergi No 10 haneli olmalı' })
  taxNumber?: string;

  @ValidateIf((o) => o.invoiceType === 'corporate')
  @IsString()
  @MinLength(2)
  taxOffice?: string;

  // Fatura adresi teslimat adresinden farklıysa (varsayılan: aynı).
  @IsOptional()
  @IsBoolean()
  billingSameAsShipping?: boolean = true;

  @ValidateIf((o) => o.billingSameAsShipping === false)
  @IsString()
  billingCity?: string;

  @ValidateIf((o) => o.billingSameAsShipping === false)
  @IsString()
  billingDistrict?: string;

  @IsOptional()
  @IsString()
  billingPostalCode?: string;

  @ValidateIf((o) => o.billingSameAsShipping === false)
  @IsString()
  @MinLength(5)
  billingAddressLine?: string;
}
