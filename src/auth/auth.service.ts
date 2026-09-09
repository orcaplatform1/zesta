import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { Response } from 'express';

export type TokenPayload =
  | { sub: string; type: 'admin'; role: string }
  | { sub: string; type: 'customer' };

const isProd = process.env.NODE_ENV === 'production';

export const ADMIN_COOKIE = 'zesta_admin_token';
export const CUSTOMER_COOKIE = 'zesta_customer_token';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  hashPassword(plain: string) {
    return argon2.hash(plain);
  }

  verifyPassword(hash: string, plain: string) {
    return argon2.verify(hash, plain);
  }

  sign(payload: TokenPayload) {
    return this.jwt.signAsync(payload);
  }

  verify(token: string): Promise<TokenPayload> {
    return this.jwt.verifyAsync<TokenPayload>(token);
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  setAdminCookie(res: Response, token: string) {
    res.cookie(ADMIN_COOKIE, token, this.cookieOptions());
  }

  clearAdminCookie(res: Response) {
    res.clearCookie(ADMIN_COOKIE, { path: '/' });
  }

  setCustomerCookie(res: Response, token: string) {
    res.cookie(CUSTOMER_COOKIE, token, this.cookieOptions());
  }

  clearCustomerCookie(res: Response) {
    res.clearCookie(CUSTOMER_COOKIE, { path: '/' });
  }
}
