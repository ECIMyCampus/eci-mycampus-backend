import type { IEmailAdapter } from '../../adapters/email.adapter';
import type { AppLogger } from '../../../../shared/utils/logger';
import type { INotificationStrategy, Notification } from './notification.strategy';

export class EmailNotificationStrategy implements INotificationStrategy {
  readonly channel = 'EMAIL' as const;

  constructor(private readonly emailAdapter: IEmailAdapter) {}

  async send(notification: Notification): Promise<void> {
    await this.emailAdapter.send({
      to: notification.recipient,
      subject: notification.subject,
      html: `<p>${escapeHtml(notification.body)}</p>`,
    });
  }
}

/**
 * Canal de respaldo mientras el módulo auth no exponga la consulta de correo por userId.
 * Deja trazabilidad estructurada de la notificación.
 */
export class LogNotificationStrategy implements INotificationStrategy {
  readonly channel = 'LOG' as const;

  constructor(private readonly logger: AppLogger) {}

  async send(notification: Notification): Promise<void> {
    this.logger.info(
      { recipient: notification.recipient, subject: notification.subject },
      `[notificación] ${notification.body}`,
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

