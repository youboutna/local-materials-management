/** Compatibility view: use the project DQE without creating records on display. */
import type { ReferentialType } from '@/config/referentials';
import ProjectDqeTab from './ProjectDqeTab';

interface QuantityTakeoffsProps {
  projectId: string;
  referentialCode?: ReferentialType;
  phaseId?: string;
}

export default function QuantityTakeoffs({ projectId, referentialCode }: QuantityTakeoffsProps) {
  return <ProjectDqeTab projectId={projectId} referentialCode={referentialCode} />;
}
