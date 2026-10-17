import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';

const mocks = vi.hoisted(() => ({
  notifications: { sendSMS: vi.fn(), scheduleCall: vi.fn(), createNotification: vi.fn() },
  createPayment: vi.fn(),
  calculate: vi.fn(),
}));
vi.mock('@/infrastructure/RepositoryFactory', () => ({
  RepositoryFactory: {
    getNotificationRepository: () => mocks.notifications,
    getInspectionRepository: () => ({}), getEmployeeRepository: () => ({}),
    getPaymentRepository: () => ({}), getProjectRepository: () => ({}),
    getMilestoneRepository: () => ({}), getPhaseRepository: () => ({}),
  },
}));
vi.mock('../AutomaticDecompteCalculator', () => ({
  AutomaticDecompteCalculator: class { calculatePhaseDecompte = mocks.calculate; },
}));
vi.mock('../CheckpointVerificationEngine', () => ({ getCheckpointVerificationEngine: () => ({}) }));
vi.mock('../PaymentService', () => ({ getPaymentService: () => ({ createPayment: mocks.createPayment }) }));
import { CommunicationService } from '../CommunicationService';
import { NotificationService } from '../NotificationService';
import { InspectionService } from '../InspectionService';
import { InspectionSchedulingService } from '../InspectionSchedulingService';
import { ConsultantScopeService } from '../ConsultantScopeService';
import { WorkflowOrchestrator } from '../WorkflowOrchestrator';

beforeEach(() => vi.clearAllMocks());

describe('Communication action results', () => {
  it('does not report a failed SMS as delivered', async () => {
    mocks.notifications.sendSMS.mockResolvedValue({ error: new Error('Delivery rejected') });
    expect(await CommunicationService.sendSMS({ to: '+22212345678', message: 'Reminder' })).toEqual({ success: false, channel: 'sms' });
  });
  it('does not report a thrown SMS failure as delivered', async () => {
    mocks.notifications.sendSMS.mockRejectedValue(new Error('Offline'));
    expect((await CommunicationService.sendSMS({ to: '+22212345678', message: 'Reminder' })).success).toBe(false);
  });
  it('does not announce a call when scheduling fails', async () => {
    mocks.notifications.scheduleCall.mockResolvedValue({ error: new Error('Rejected') });
    expect((await CommunicationService.scheduleCall({ recipientId: 'user', recipientPhone: '+22212345678', subject: 'Payment', message: 'Follow up', scheduledFor: '2026-11-01T10:00:00Z' })).success).toBe(false);
    expect(mocks.notifications.createNotification).not.toHaveBeenCalled();
  });
  it('never uses a user UUID as a phone', async () => {
    expect((await CommunicationService.scheduleCall({ recipientId: 'user', recipientPhone: 'a0000000-0000-0000-0000-000000000001', subject: 'Payment', message: 'Follow up', scheduledFor: '2026-11-01' })).success).toBe(false);
    expect(mocks.notifications.scheduleCall).not.toHaveBeenCalled();
  });
});

describe('Inspection scheduling persistence', () => {
  it('persists the chosen date and inspector and returns the stored inspection', async () => {
    const existing = Inspection.create({ id: 'inspection', date: '2026-10-01', inspector: 'old' });
    const stored = Inspection.create({ id: 'inspection', date: '2026-11-01T10:00:00Z', inspector: 'new', status: InspectionStatus.Scheduled });
    const repository = { findById: vi.fn().mockResolvedValueOnce(existing).mockResolvedValueOnce(stored), update: vi.fn() } as unknown as IInspectionRepository;
    expect(await new InspectionService(repository).updateInspection('inspection', { date: stored.date, inspector: 'new', status: 'scheduled' })).toBe(stored);
    expect(repository.update).toHaveBeenCalledWith('inspection', expect.objectContaining({ date: stored.date, inspector: expect.objectContaining({ id: 'new' }), status: InspectionStatus.Scheduled }));
  });
  it('refuses missing inspection IDs rather than updating a workflow step', async () => {
    const repository = { update: vi.fn() } as unknown as IInspectionRepository;
    await expect(new InspectionSchedulingService(repository).scheduleInspection({ inspectionId: '', scheduledDate: '2026-11-01', scheduledTime: '10:00', estimatedDuration: 1, inspectorId: 'inspector', requiredDocuments: [] })).rejects.toThrow();
    expect(repository.update).not.toHaveBeenCalled();
  });
  it('refuses nonexistent inspections', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(null), update: vi.fn() } as unknown as IInspectionRepository;
    await expect(new InspectionSchedulingService(repository).scheduleInspection({ inspectionId: 'step-id', scheduledDate: '2026-11-01', scheduledTime: '10:00', estimatedDuration: 1, inspectorId: 'inspector', requiredDocuments: [] })).rejects.toThrow();
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('Notification context and consultant scope', () => {
  it('preserves project and phase context through persistence', async () => {
    const repository = { createNotification: vi.fn(async data => ({ notification: { ...data, id: 'notification' }, error: null })) } as unknown as INotificationRepository;
    const result = await new NotificationService(repository).createNotification({ recipientId: 'user', title: 'Inspection', message: 'Scheduled', type: 'info', projectId: 'project', phaseId: 'phase' });
    expect(result).toMatchObject({ projectId: 'project', phaseId: 'phase' });
    expect(repository.createNotification).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project', phaseId: 'phase' }));
  });
  it('excludes unrelated and unassociated records from consultant project results', () => {
    expect(ConsultantScopeService.filterProjects([{ id: 'mine', projectId: 'p1' }, { id: 'other', projectId: 'p2' }, { id: 'global', projectId: null }], ['p1'])).toEqual([{ id: 'mine', projectId: 'p1' }]);
    expect(ConsultantScopeService.filterProjects([{ projectId: 'p1' }], [])).toEqual([]);
  });
});

describe('Workflow payment triggers', () => {
  it('requires real contractor identity and contact before creating payment', async () => {
    expect((await new WorkflowOrchestrator('project').triggerPayment({ phaseId: 'phase', amount: 100 })).success).toBe(false);
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });
  it('rejects nonfinite payment amounts', async () => {
    expect((await new WorkflowOrchestrator('project').triggerPayment({ phaseId: 'phase', amount: NaN, contractorId: 'supplier', contractorName: 'Supplier', contractorContact: 'supplier@example.test' })).success).toBe(false);
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });
  it('reports the actual capped payment rather than the requested amount', async () => {
    mocks.calculate.mockResolvedValue({ netPayable: 80, contractAmount: 1000, cumulativeAmount: 80 });
    mocks.createPayment.mockResolvedValue({ id: 'payment' });
    const orchestrator = new WorkflowOrchestrator('project');
    const listener = vi.fn(); orchestrator.subscribe(listener);
    expect((await orchestrator.triggerPayment({ phaseId: 'phase', amount: 100, contractorId: 'supplier', contractorName: 'Supplier', contractorContact: 'supplier@example.test' })).success).toBe(true);
    expect(mocks.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: 80, contractorId: 'supplier' }));
    expect(listener).toHaveBeenCalledWith({ type: 'PAYMENT_CREATED', payload: { paymentId: 'payment', amount: 80 } });
  });
});