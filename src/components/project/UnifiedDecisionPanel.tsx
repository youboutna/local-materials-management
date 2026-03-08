import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentService } from '@/application/services/DocumentService';
import { MilestoneService } from '@/application/services/MilestoneService';
import type { DecisionNode } from '@/dtos/workflows/UnifiedWorkflowDTO';
import { useAuth } from '@/contexts/use-auth';

interface UnifiedDecisionPanelProps {
  decisionNode: DecisionNode | null;
  projectId?: string;
  phaseId?: string;
  onClose?: () => void;
  onActionComplete?: (result?: unknown) => void;
  isModal?: boolean;
}

const UnifiedDecisionPanel: React.FC<UnifiedDecisionPanelProps> = ({ decisionNode, projectId, phaseId, onClose, onActionComplete, isModal = false }) => {
  const node = decisionNode;
  const { user } = useAuth();
  const [documents, setDocuments] = useState<unknown[]>([]);

  useEffect(() => {
    if (!projectId) return;
    DocumentService.getProjectDocuments(projectId)
      .then((docs) => setDocuments(docs || []))
      .catch((e) => console.error('fetch documents', e));
  }, [projectId]);

  const panelTitleId = node ? `decision-panel-title-${node.id}` : 'decision-panel-title';
  const panelDescId = node ? `decision-panel-desc-${node.id}` : 'decision-panel-desc';

  useEffect(() => {
    if (!node) return;
    // focus first actionable element when panel mounts
      const timer = setTimeout(() => {
        const el = document.querySelector<HTMLButtonElement>(`#decision-panel-${node.id} button`);
        if (el) el.focus();
        else {
          const container = document.getElementById(`decision-panel-${node.id}`);
          if (container) container.focus();
        }
      }, 50);
    return () => clearTimeout(timer);
  }, [node]);

  if (!node) return null;

  const openDocument = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

   const handleCreateDocument = async () => {
     try {
       const payload: any = {
         name: `Document - ${node.name}`,
         description: node.description || undefined,
         type: 'report',
         projectId: projectId,
       };
       const created = await new DocumentService().createDocument(payload);
       // refresh local documents
       if (projectId) {
         const docs = await DocumentService.getProjectDocuments(projectId);
         setDocuments(docs || []);
       }
       if (onActionComplete) onActionComplete(created);
     } catch (err) {
       console.error('createDocument error', err);
     }
   };

  const handleTriggerMilestone = async (action?: { id: string; label: string; action?: string }) => {
    try {
      if (!phaseId || !projectId) return;
      // Map common action names to MilestoneService instance methods
      const act = action?.action || action?.id;
      const milestoneService = new MilestoneService();
      let res: unknown;
      if (act === 'approve' || act === 'approve_gate') {
        const approver = user?.email || user?.id || 'system';
        // Use updateMilestone to approve
        res = await milestoneService.updateMilestone(node.id, { 
          status: 'completed' as const
        });
      } else if (act === 'toggle_complete' || act === 'toggle' || act === 'complete') {
        // Use updateMilestone to mark as completed
        res = await milestoneService.updateMilestone(node.id, { 
          status: 'completed' as const,
          actual_completion_date: new Date().toISOString().slice(0, 10)
        });
      } else {
        // fallback: mark as completed
        res = await milestoneService.updateMilestone(node.id, { 
          status: 'completed' as const
        });
      }
      if (onActionComplete) onActionComplete(res);
    } catch (err) {
      console.error('triggerMilestone error', err);
    }
  };

  return (
    <aside
      id={`decision-panel-${node.id}`}
      className="w-96"
      role={isModal ? 'dialog' : 'region'}
      aria-labelledby={panelTitleId}
      aria-describedby={panelDescId}
      aria-modal={isModal ? 'true' : undefined}
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') { if (onClose) onClose(); } }}
    >
      <Card>
        <CardHeader>
          <CardTitle id={panelTitleId} className="flex items-center justify-between">
            <span>{node.name}</span>
            <Badge>{node.type}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{node.description}</p>

            <div>
              <h5 className="text-sm font-medium">Documents</h5>
              <div className="mt-2 space-y-2">
                {Array.isArray(node.documents) && node.documents.length > 0 ? (
                  node.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between">
                      <div className="truncate text-sm">{d.title}</div>
                      <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDocument(d.file_url)} aria-label={`Ouvrir ${d.title}`}>
                            Ouvrir
                          </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">Aucun document</div>
                )}
                <div>
                    <Button size="sm" onClick={handleCreateDocument} aria-label={`Créer un document pour ${node.name}`}>Créer document</Button>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium">Actions suggérées</h5>
              <div className="mt-2 space-y-2">
                {Array.isArray(node.suggestedActions) && node.suggestedActions.length > 0 ? (
                  node.suggestedActions.map((a) => (
                    <div key={a.id} className="flex items-center justify-between">
                      <div className="truncate text-sm">{a.label}</div>
                      <div>
                          <Button size="sm" onClick={() => handleTriggerMilestone(a)} aria-label={`Exécuter ${a.label} sur ${node.name}`}>{a.label}</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">Aucune action</div>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium">Métadonnées</h5>
              <pre className="mt-2 text-xs bg-muted p-2 rounded max-h-40 overflow-auto">{JSON.stringify(node.metadata || {}, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onClose && onClose()}>Fermer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default UnifiedDecisionPanel;
