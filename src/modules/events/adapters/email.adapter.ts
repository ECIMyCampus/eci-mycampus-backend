/** Puerto hacia el proveedor de correo transaccional (Adapter pattern). */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface IEmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

