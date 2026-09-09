import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, CUSTOMER_COOKIE } from '../auth.service.js';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[CUSTOMER_COOKIE];
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.auth.verify(token);
      if (payload.type !== 'customer') throw new UnauthorizedException();
      (req as Request & { customer: typeof payload }).customer = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

// Sepet/checkout gibi misafirin de erişebildiği rotalarda kullanılır: token varsa
// customer'ı req'e ekler, yoksa/hatalıysa sessizce geçer (guest akışı bozulmaz).
@Injectable()
export class OptionalCustomerAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[CUSTOMER_COOKIE];
    if (!token) return true;

    try {
      const payload = await this.auth.verify(token);
      if (payload.type === 'customer') {
        (req as Request & { customer: typeof payload }).customer = payload;
      }
    } catch {
      // guest olarak devam
    }
    return true;
  }
}
