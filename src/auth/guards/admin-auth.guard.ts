import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ADMIN_COOKIE, AuthService } from '../auth.service.js';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.auth.verify(token);
      if (payload.type !== 'admin') throw new UnauthorizedException();
      (req as Request & { admin: typeof payload }).admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
