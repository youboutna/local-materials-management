/**
 * DqeHub — routes dédiées à l'Expression de besoin (DQE) :
 *   • /dqe/list | /dqe/new | /dqe/:id                              (hors contexte projet)
 *   • /projects/:projectId/dqe/list | /new | /:id                  (contexte projet imposé)
 *
 * Aucune logique métier ici : la coquille mutualisée `DqeWorkspace` (hexagonale)
 * porte le workflow DRAFT → SUBMITTED → VALIDATED, le parser, les catalogues et
 * les parties (Émetteur / Destinataire / Factur-X).
 */
import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { DqeWorkspace } from '@/components/boq/DqeWorkspace';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';
import { resolveProjectLabel } from '@/utils/entityLabels';
import { useI18n } from '@/hooks/useI18n';
import type { ReferentialType } from '@/config/referentials';

type Mode = 'list' | 'new' | 'detail';

interface Props {
  mode: Mode;
}

const DqeHub: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [search, setSearch] = useSearchParams();
  const { projects, isLoading } = useProjectsHex();
  const { t } = useI18n();

  /** Contexte projet imposé par la route `/projects/:projectId/dqe/...`. */
  const scopedProjectId = params.projectId ?? null;
  const projectId = scopedProjectId ?? search.get('projectId') ?? '';
  const documentId = mode === 'detail' ? params.id ?? null : mode === 'new' ? undefined : null;
  const basePath = scopedProjectId ? `/projects/${scopedProjectId}/dqe` : '/dqe';

  const project = useMemo(
    () => (projects ?? []).find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );

  const setProject = (id: string) => {
    const next = new URLSearchParams(search);
    next.set('projectId', id);
    setSearch(next, { replace: true });
  };

  const goto = (docId: string | null) => {
    const qs = !scopedProjectId && projectId ? `?projectId=${projectId}` : '';
    navigate(docId ? `${basePath}/${docId}${qs}` : `${basePath}/list${qs}`);
  };

  const projectLabel = project ? resolveProjectLabel(project) : '';
  const referentialCode = (project as { referentialCode?: ReferentialType } | null)?.referentialCode;

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5" />
            {t('dqe.navigation.module')}
            {projectLabel ? <span className="text-sm font-normal text-muted-foreground">· {projectLabel}</span> : null}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!scopedProjectId && (
              <Select value={projectId} onValueChange={setProject} disabled={isLoading}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder={t('dqe.navigation.select_project')} />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{resolveProjectLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {mode !== 'list' ? (
              <Button variant="outline" size="sm" onClick={() => goto(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('dqe.navigation.list')}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!projectId}
                onClick={() => navigate(`${basePath}/new${!scopedProjectId ? `?projectId=${projectId}` : ''}`)}
              >
                {t('dqe.navigation.new')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {!projectId ? (
            <p className="text-sm text-muted-foreground">{t('dqe.navigation.select_project_hint')}</p>
          ) : (
            <DqeWorkspace
              routeContext="project-dqe"
              projectId={projectId}
              projectName={projectLabel}
              referentialCode={referentialCode}
              documentId={documentId}
              autoCreate={mode === 'new'}
              onDocumentIdChange={goto}
              showComparison={mode === 'detail'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DqeHub;
