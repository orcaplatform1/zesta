import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AdminRole } from '../../generated/prisma/enums.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

// AdminAuthGuard'dan sonra çalışmalı (req.admin'in set edilmiş olmasına bağlıdır).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { admin?: { role: string } }>();
    const role = req.admin?.role;
    if (!role || !required.includes(role as AdminRole)) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    return true;
  }
}
