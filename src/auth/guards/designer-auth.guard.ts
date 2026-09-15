import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, DESIGNER_COOKIE } from '../auth.service.js';

@Injectable()
export class DesignerAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[DESIGNER_COOKIE];
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.auth.verify(token);
      if (payload.type !== 'designer') throw new UnauthorizedException();
      (req as Request & { designer: typeof payload }).designer = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
