import type { AppLogger } from '../../../../shared/utils/logger';
import type { EmailMessage, IEmailAdapter } from '../email.adapter';

/** Adaptador determinista para desarrollo local y pruebas: solo registra el correo. */
export class ConsoleEmailAdapter implements IEmailAdapter {
  constructor(private readonly logger: AppLogger) {}

  async send(message: EmailMessage): Promise<void> {
    this.logger.info({ to: message.to, subject: message.subject }, '[email:dev] Correo simulado');
  }
}

