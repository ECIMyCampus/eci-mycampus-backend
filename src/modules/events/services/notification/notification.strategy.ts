export type NotificationChannel = 'EMAIL' | 'LOG';

export interface Notification {
  channel: NotificationChannel;
  /** Correo (canal EMAIL) o id de usuario (canal LOG). */
  recipient: string;
  subject: string;
  body: string;
}

/** Strategy: cada canal sabe cómo despachar una notificación. */
export interface INotificationStrategy {
  readonly channel: NotificationChannel;
  send(notification: Notification): Promise<void>;
}

