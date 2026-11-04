import { Resend } from 'resend';
import type { EmailMessage, IEmailAdapter } from '../email.adapter';

/** Adaptador real hacia Resend. Es la única clase que conoce el SDK. */
export class ResendEmailAdapter implements IEmailAdapter {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });
    if (error) {
      throw new Error(`Resend rechazó el correo: ${error.message}`);
    }
  }
}

