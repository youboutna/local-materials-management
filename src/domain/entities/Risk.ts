// Domain Entity: Risk
// Pure business logic without infrastructure concerns

export type RiskStatus = 'identified' | 'monitored' | 'mitigated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export class Risk {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly probability: number, // 0-1
    public readonly impact: number, // 0-1
    public readonly status: RiskStatus,
    public readonly mitigationStrategy: string | null,
    public readonly identifiedBy: string | null,
    public readonly identifiedDate: string | null,
    public readonly relatedTasks: string[],
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // Business logic
  getRiskScore(): number {
    return this.probability * this.impact;
  }

  getRiskLevel(): RiskLevel {
    const score = this.getRiskScore();
    if (score >= 0.7) return 'critical';
    if (score >= 0.5) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  requiresImmediateAction(): boolean {
    return this.getRiskLevel() === 'critical' && this.status !== 'mitigated' && this.status !== 'resolved';
  }

  isActive(): boolean {
    return this.status === 'identified' || this.status === 'monitored';
  }

  hasMitigation(): boolean {
    return !!this.mitigationStrategy && this.mitigationStrategy.trim().length > 0;
  }

  getProbabilityLabel(): string {
    if (this.probability >= 0.8) return 'Très probable';
    if (this.probability >= 0.6) return 'Probable';
    if (this.probability >= 0.4) return 'Possible';
    if (this.probability >= 0.2) return 'Peu probable';
    return 'Rare';
  }

  getImpactLabel(): string {
    if (this.impact >= 0.8) return 'Critique';
    if (this.impact >= 0.6) return 'Majeur';
    if (this.impact >= 0.4) return 'Modéré';
    if (this.impact >= 0.2) return 'Mineur';
    return 'Négligeable';
  }

  // Factory method
  static create(params: {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    probability: number;
    impact: number;
    mitigationStrategy?: string;
    identifiedBy?: string;
  }): Risk {
    return new Risk(
      params.id,
      params.projectId,
      params.title,
      params.description || null,
      Math.max(0, Math.min(1, params.probability)),
      Math.max(0, Math.min(1, params.impact)),
      'identified',
      params.mitigationStrategy || null,
      params.identifiedBy || null,
      new Date().toISOString(),
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
