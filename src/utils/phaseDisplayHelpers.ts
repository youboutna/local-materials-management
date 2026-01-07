/**
 * Phase Display Helpers
 * Utility functions for formatting and displaying phase data
 * Max 150 lines following SRP
 */

import { PhaseStatus } from "@/types/phase-dto";

// Status display helpers
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

// Financial health display helpers
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

export const getFinancialHealthIcon = (health: string): string => {
  switch (health) {
    case 'excellent': return '✓';
    case 'good': return '●';
    case 'warning': return '⚠';
    case 'critical': return '✕';
    default: return '○';
  }
};

// Date formatting
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

export const formatShortDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Currency formatting
export const formatCurrency = (amount?: number | null): string => {
  if (amount === undefined || amount === null) return "0 MRU";
  return `${amount.toLocaleString("fr-FR")} MRU`;
};

// Days calculation
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

// Progress calculations
export const calculateProgressPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Budget utilization color
export const getBudgetUtilizationColor = (utilization: number): string => {
  if (utilization > 100) return "text-red-600";
  if (utilization > 90) return "text-amber-600";
  if (utilization > 75) return "text-yellow-600";
  return "text-green-600";
};

// Progress bar color based on percentage
export const getProgressBarClass = (percentage: number): string => {
  if (percentage >= 100) return "bg-green-100 [&>div]:bg-green-600";
  if (percentage >= 75) return "bg-blue-100 [&>div]:bg-blue-600";
  if (percentage >= 50) return "bg-yellow-100 [&>div]:bg-yellow-600";
  if (percentage >= 25) return "bg-amber-100 [&>div]:bg-amber-600";
  return "bg-gray-100 [&>div]:bg-gray-600";
};
