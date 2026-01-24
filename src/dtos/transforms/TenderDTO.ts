/**
 * Tender DTOs
 * Data transfer objects for API/UI exchanges
 * NOT domain entities - just data structures
 */

export interface EvaluationCriteriaDTO {
  name: string;
  weight: number;
  description?: string;
  category: 'technical' | 'financial' | 'experience' | 'compliance';
  scoringMethod: 'points' | 'percentage' | 'qualitative';
  maxScore: number;
}

export interface TenderDTO {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'materials' | 'equipment' | 'services' | 'intellectual_services';
  status: 'draft' | 'published' | 'closed' | 'cancelled' | 'awarded';
  budget?: number;
  currency?: string;
  publicationDate?: string;
  submissionDeadline?: string;
  evaluationDate?: string;
  awardDate?: string;
  requirements?: string[];
  evaluationCriteria?: EvaluationCriteriaDTO[];
  submissions?: string[]; // Submission IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenderRequestDTO {
  projectId: string;
  title: string;
  description: string;
  type: 'materials' | 'equipment' | 'services' | 'intellectual_services';
  budget?: number;
  currency?: string;
  publicationDate?: string;
  submissionDeadline?: string;
  requirements?: string[];
  evaluationCriteria?: EvaluationCriteriaDTO[];
}

export interface UpdateTenderRequestDTO {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'closed' | 'cancelled' | 'awarded';
  budget?: number;
  currency?: string;
  submissionDeadline?: string;
  evaluationDate?: string;
  awardDate?: string;
  requirements?: string[];
  evaluationCriteria?: EvaluationCriteriaDTO[];
}
