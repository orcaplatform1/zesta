import { IsString } from 'class-validator';

export class CreateShipmentDto {
  @IsString()
  carrier!: string;

  @IsString()
  trackingNumber!: string;
}
