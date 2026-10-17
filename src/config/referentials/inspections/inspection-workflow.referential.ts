/** Existing inspection policy; configurable defaults, not authorization grants. */
import type { WorkflowTransition, RequiredDocument } from '@/application/services/InspectionWorkflowService';

export const INSPECTION_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
    {
      from: 'requested',
      to: 'scheduled',
      requiredRole: ['technical_manager', 'inspector']
    },
    {
      from: 'scheduled',
      to: 'in_progress',
      requiredRole: ['inspector']
    },
    {
      from: 'in_progress',
      to: 'completed',
      requiredRole: ['inspector']
    },
    {
      from: 'completed',
      to: 'approved',
      requiredRole: ['technical_manager', 'project_manager'],
      requiresApproval: true
    },
    {
      from: 'completed',
      to: 'rejected',
      requiredRole: ['technical_manager', 'project_manager'],
      requiresApproval: true
    },
    {
      from: 'completed',
      to: 'requires_changes',
      requiredRole: ['technical_manager', 'project_manager']
    }
  ];

  // Required documents by inspection type
export const INSPECTION_REQUIRED_DOCUMENTS: Record<string, RequiredDocument[]> = {
    'regular': [
      { type: 'pv_service_fait', label: 'PV de service fait', required: true, maxCount: 1, acceptedFormats: ['pdf'] },
      { type: 'photos', label: 'Photos de fin de travaux', required: true, minCount: 5, maxCount: 20, acceptedFormats: ['jpg', 'jpeg', 'png'] }
    ],
    'main_levee': [
      { type: 'pv_main_levee', label: 'PV de main levée', required: true, maxCount: 1, acceptedFormats: ['pdf'] },
      { type: 'photos', label: 'Photos de fin de travaux', required: true, minCount: 10, maxCount: 30, acceptedFormats: ['jpg', 'jpeg', 'png'] },
      { type: 'geolocation', label: 'Coordonnées GPS', required: false, maxCount: 1, acceptedFormats: ['gpx', 'kml'] }
    ],
    'decompte': [
      { type: 'decompte', label: 'Décompte de travaux', required: true, maxCount: 1, acceptedFormats: ['pdf', 'xlsx'] },
      { type: 'attachement', label: 'Attachements', required: true, minCount: 1, acceptedFormats: ['pdf'] },
      { type: 'photos', label: 'Photos des travaux', required: true, minCount: 5, maxCount: 15, acceptedFormats: ['jpg', 'jpeg', 'png'] }
    ]
  };

