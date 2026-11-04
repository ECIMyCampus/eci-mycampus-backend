import type { INotificationStrategy, NotificationChannel } from './notification.strategy';

/**
 * Factory respaldada por un Map poblado con las estrategias inyectadas (OCP):
 * agregar un canal nuevo (PUSH, WhatsApp) = crear una estrategia y registrarla en el container.
 */
export class NotificationStrategyFactory {
  private readonly strategies = new Map<NotificationChannel, INotificationStrategy>();

  constructor(strategies: INotificationStrategy[]) {
    for (const strategy of strategies) {
      this.strategies.set(strategy.channel, strategy);
    }
  }

  getStrategy(channel: NotificationChannel): INotificationStrategy {
    const strategy = this.strategies.get(channel);
    if (!strategy) {
      throw new Error(`No existe estrategia de notificación configurada para el canal ${channel}.`);
    }
    return strategy;
  }
}

