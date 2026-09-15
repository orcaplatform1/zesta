import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, DESIGNER_COOKIE } from '../auth.service.js';

// Not: bu guard sadece kimlik doğrular (geçerli oturum var mı). isActive=false
// (askıya alınmış) hesapların yine de GET /designers/me gibi salt-okunur
// uçlara erişip panelde "askıya alındınız" mesajını görebilmesi gerekiyor —
// o yüzden askı kontrolü burada değil, ürün ekleme/ödeme talebi gibi asıl
// işlemi yapan servis metotlarında (bkz. DesignersService) yapılıyor.
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
