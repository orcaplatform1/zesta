import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from = 'mdagdeviren@zesta.tr';

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async send(to: string | string[], subject: string, html: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `Zesta <${this.from}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });
      if (error) this.logger.error('Mail gönderilemedi', error);
      return data;
    } catch (err) {
      this.logger.error('Mail hatası', err);
    }
  }
}
