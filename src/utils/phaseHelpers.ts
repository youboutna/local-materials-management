import { CheckCircle, RefreshCw, AlertTriangle, Clock, TrendingUp, Info } from 'lucide-react';
import React from 'react';

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' | 'not_started' | 'on_hold';

export const getStatusColor = (status: PhaseStatus | string): string => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "delayed":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
    case "on_hold":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getStatusIcon = (status: PhaseStatus | string): React.ReactNode => {
  switch (status) {
    case "completed":
      return React.createElement(CheckCircle, { className: "h-4 w-4" });
    case "in_progress":
      return React.createElement(RefreshCw, { className: "h-4 w-4" });
    case "delayed":
      return React.createElement(AlertTriangle, { className: "h-4 w-4" });
    default:
      return React.createElement(Clock, { className: "h-4 w-4" });
  }
};

export const getStatusLabel = (status: PhaseStatus | string): string => {
  const labels: Record<string, string> = {
    completed: "Terminé",
    in_progress: "En cours",
    delayed: "En retard",
    pending: "En attente",
    cancelled: "Annulé",
    not_started: "Non commencé",
  };
  return labels[status] || status;
};

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "Non définie";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Date invalide";
  }
};

export const formatCurrency = (amount?: number | null): string => {
  if (!amount && amount !== 0) return "0 MRU";
  return `${amount.toLocaleString("fr-FR")} MRU`;
};

export const calculateRemainingDays = (endDate?: string | null): number | string => {
  if (!endDate) return "N/A";
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return "N/A";
  }
};

export type FinancialHealth = 'excellent' | 'good' | 'warning' | 'critical' | 'unknown';

export const getFinancialHealthColor = (health: string): string => {
  switch (health) {
    case 'excellent': return 'text-green-600 bg-green-100 border-green-200';
    case 'good': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    case 'warning': return 'text-amber-600 bg-amber-100 border-amber-200';
    case 'critical': return 'text-red-600 bg-red-100 border-red-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const getFinancialHealthLabel = (health: string): string => {
  switch (health) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Bon';
    case 'warning': return 'Attention';
    case 'critical': return 'Critique';
    default: return 'Inconnu';
  }
};

export const getFinancialHealthIcon = (health: string): React.ReactNode => {
  switch (health) {
    case 'excellent': return React.createElement(CheckCircle, { className: "h-4 w-4" });
    case 'good': return React.createElement(TrendingUp, { className: "h-4 w-4" });
    case 'warning': return React.createElement(AlertTriangle, { className: "h-4 w-4" });
    case 'critical': return React.createElement(AlertTriangle, { className: "h-4 w-4" });
    default: return React.createElement(Info, { className: "h-4 w-4" });
  }
};

// Milestone type helpers
export type MilestoneType = 'point_controle' | 'reception_provisoire' | 'reception_definitive' | 'other';

export const getMilestoneTypeLabel = (type: MilestoneType | string): string => {
  const labels: Record<string, string> = {
    point_controle: 'Point de Contrôle',
    reception_provisoire: 'Réception Provisoire',
    reception_definitive: 'Réception Définitive',
    other: 'Autre',
  };
  return labels[type] || type;
};

export const getMilestoneTypeColor = (type: MilestoneType | string): string => {
  switch (type) {
    case 'point_controle': return 'bg-blue-100 text-blue-800';
    case 'reception_provisoire': return 'bg-amber-100 text-amber-800';
    case 'reception_definitive': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Workflow status helpers
export type WorkflowStatus = 'not_started' | 'in_progress' | 'validation_pending' | 'approved' | 'blocked';

export const getWorkflowStatusColor = (status: WorkflowStatus | string): string => {
  switch (status) {
    case 'not_started': return 'bg-gray-100 text-gray-700';
    case 'in_progress': return 'bg-blue-100 text-blue-700';
    case 'validation_pending': return 'bg-amber-100 text-amber-700';
    case 'approved': return 'bg-green-100 text-green-700';
    case 'blocked': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getWorkflowStatusLabel = (status: WorkflowStatus | string): string => {
  const labels: Record<string, string> = {
    not_started: 'Non démarré',
    in_progress: 'En cours',
    validation_pending: 'En validation',
    approved: 'Approuvé',
    blocked: 'Bloqué',
  };
  return labels[status] || status;
};

// Progress calculation helpers
export const calculateWeightedProgress = (
  items: Array<{ progress: number; weight?: number }>
): number => {
  if (!items || items.length === 0) return 0;
  
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  const weightedSum = items.reduce(
    (sum, item) => sum + item.progress * (item.weight || 1),
    0
  );
  
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
};

export const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'bg-green-500';
  if (progress >= 70) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-amber-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

// ============================================================
// Project lifecycle stages — Planification → Exécution → Contrôle → Clôture
// Pure derivation from phase type/status. No hardcode in UI components.
// ============================================================
export type LifecycleStage = 'PLANIFICATION' | 'EXECUTION' | 'CONTROLE' | 'CLOTURE';

export interface LifecycleStageMeta {
  stage: LifecycleStage;
  label: string;
  tokenClass: string;
  description: string;
}

const STAGE_META: Record<LifecycleStage, LifecycleStageMeta> = {
  PLANIFICATION: { stage: 'PLANIFICATION', label: 'Planification', tokenClass: 'bg-stage-plan/10 text-stage-plan border-stage-plan/30', description: 'Conception, études, WBS' },
  EXECUTION:     { stage: 'EXECUTION',     label: 'Exécution',     tokenClass: 'bg-stage-exec/10 text-stage-exec border-stage-exec/30', description: 'Travaux et livraisons en cours' },
  CONTROLE:      { stage: 'CONTROLE',      label: 'Contrôle',      tokenClass: 'bg-stage-control/10 text-stage-control border-stage-control/30', description: 'Inspections, conformité, qualité' },
  CLOTURE:       { stage: 'CLOTURE',       label: 'Clôture',       tokenClass: 'bg-stage-close/10 text-stage-close border-stage-close/30', description: 'Réception définitive, archivage' },
};

const PLAN_TYPES = new Set(['planning','design','preparation','study','conception','planification']);
const EXEC_TYPES = new Set(['construction','execution','implementation','travaux']);
const CONTROL_TYPES = new Set(['inspection','quality','compliance','audit','controle','control']);
const CLOSE_TYPES = new Set(['closure','handover','reception','cloture','archive']);

export const getPhaseLifecycleStage = (phase: { type?: string | null; status?: string | null }): LifecycleStage => {
  const t = (phase.type || '').toString().toLowerCase();
  const s = (phase.status || '').toString().toLowerCase();
  if (CLOSE_TYPES.has(t) || s === 'closed' || s === 'completed') return 'CLOTURE';
  if (CONTROL_TYPES.has(t)) return 'CONTROLE';
  if (EXEC_TYPES.has(t) || s === 'in_progress') return 'EXECUTION';
  if (PLAN_TYPES.has(t) || s === 'pending' || s === 'not_started') return 'PLANIFICATION';
  return 'EXECUTION';
};

export const getLifecycleStageMeta = (stage: LifecycleStage): LifecycleStageMeta => STAGE_META[stage];

export const ALL_LIFECYCLE_STAGES: LifecycleStage[] = ['PLANIFICATION','EXECUTION','CONTROLE','CLOTURE'];

