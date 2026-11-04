import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * AlertsProcessorService — déclenche le traitement réel des alertes projet
 * (fonction serveur project-alerts-processor) et rapporte son vrai résultat.
 */
export interface AlertsProcessorRunResult {
  processed: number;
  failed: number;
  alertsGenerated: number;
  durationMs: number;
  message: string;
}

export interface IAlertsProcessorPort {
  run(options: { batchSize?: number }): Promise<Omit<AlertsProcessorRunResult, 'durationMs'>>;
}

export class AlertsProcessorService {
  constructor(private readonly port: IAlertsProcessorPort, private readonly now: () => number = () => Date.now()) {}

  async run(options: { batchSize?: number } = {}): Promise<AlertsProcessorRunResult> {
    const started = this.now();
    const result = await this.port.run(options);
    return {
      processed: Number(result.processed) || 0,
      failed: Number(result.failed) || 0,
      alertsGenerated: Number(result.alertsGenerated) || 0,
      message: result.message ?? '',
      durationMs: this.now() - started,
    };
  }
}

let instance: AlertsProcessorService | null = null;

export async function getAlertsProcessorService(): Promise<AlertsProcessorService> {
  if (!instance) {
    const notificationGatewayAdapter = await RepositoryFactory.getNotificationGateway();
    instance = new AlertsProcessorService({
      async run(options) {
        const { data, error } = await notificationGatewayAdapter.invokeFunction<Record<string, unknown>>(
          'project-alerts-processor',
          options,
        );
        if (error || !data || data.error) throw new Error(String(data?.error ?? error?.message ?? 'ALERTS_PROCESSOR_FAILED'));
        return {
          processed: Number(data.processed) || 0,
          failed: Number(data.failed) || 0,
          alertsGenerated: Number(data.alertsGenerated) || 0,
          message: String(data.message ?? ''),
        };
      },
    });
  }
  return instance;
}
