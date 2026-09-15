import { IsNumber, Min } from 'class-validator';

export class RequestPayoutDto {
  // "Her 1000 TL'lik satışta ödeme talebi" — minimum çekim tutarı.
  @IsNumber()
  @Min(1000)
  amount!: number;
}
