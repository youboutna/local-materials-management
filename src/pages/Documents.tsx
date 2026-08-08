import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout';
import { useProjectsHex, useTenders } from '@/hooks/hexagonal';
import { TenderDocumentsPanel } from '@/components/tenders/TenderDocumentsPanel';
import {
  ProjectDocumentsPanel,
  SupplierDocumentsPanel,
} from '@/components/documents/panels';
import { useSuppliersList } from '@/hooks/hexagonal/useSuppliersCrudHex';
import { FolderKanban, Gavel, Truck, ShieldCheck } from 'lucide-react';

type Scope = 'project' | 'tender' | 'supplier';

const SCOPES: { id: Scope; label: string; icon: any; description: string }[] = [
  { id: 'project', label: 'Projet', icon: FolderKanban, description: "Documents rattachés à un projet et ses phases." },
  { id: 'tender', label: "Appel d'offres", icon: Gavel, description: 'DPAO, pièces techniques, financières et administratives par lot.' },
  { id: 'supplier', label: 'Fournisseur', icon: Truck, description: 'RC, attestations, contrats fournisseurs.' },
];

function useSuppliers() {
  const { data: suppliers = [], ...rest } = useSuppliersList();
  const data = useMemo(
    () =>
      [...suppliers]
        .map((s: any) => ({ id: s.id, name: s.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 500),
    [suppliers]
  );
  return { ...rest, data };
}

export default function Documents() {
  const [scope, setScope] = useState<Scope>('project');
  const [projectId, setProjectId] = useState<string>('');
  const [tenderId, setTenderId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');

  const { projects = [] } = useProjectsHex();
  const { data: tenders = [] } = useTenders();
  const { data: suppliers = [] } = useSuppliers();

  const currentPicker = useMemo(() => {
    switch (scope) {
      case 'project':
        return (
          <ScopePicker
            label="Projet"
            value={projectId}
            onChange={setProjectId}
            options={(projects as any[]).map((p) => ({ value: p.id, label: p.title }))}
          />
        );
      case 'tender':
        return (
          <ScopePicker
            label="Appel d'offres"
            value={tenderId}
            onChange={setTenderId}
            options={(tenders as any[]).map((t) => ({
              value: t.id,
              label: `${t.tender_number ? `[${t.tender_number}] ` : ''}${t.title}`,
            }))}
          />
        );
      case 'supplier':
        return (
          <ScopePicker
            label="Fournisseur"
            value={supplierId}
            onChange={setSupplierId}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
        );
    }
  }, [scope, projectId, tenderId, supplierId, projects, tenders, suppliers]);

  const activeTender = (tenders as any[]).find((t) => t.id === tenderId);

  return (
    <AppLayout pageTitle="Documents">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Gestion électronique des documents (GED)</CardTitle>
            </div>
            <CardDescription>
              Espace unifié — projets, appels d'offres, fournisseurs. Aperçu sécurisé via passerelle (l'URL de stockage n'est pas exposée).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <TabsList className="grid w-full grid-cols-3">
                {SCOPES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <TabsTrigger key={s.id} value={s.id} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {s.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {SCOPES.map((s) => (
                <TabsContent key={s.id} value={s.id} className="pt-3">
                  <p className="mb-3 text-sm text-muted-foreground">{s.description}</p>
                  {currentPicker}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {scope === 'project' && projectId && <ProjectDocumentsPanel projectId={projectId} />}
        {scope === 'tender' && tenderId && (
          <TenderDocumentsPanel tenderId={tenderId} projectId={activeTender?.project_id ?? undefined} />
        )}
        {scope === 'supplier' && supplierId && <SupplierDocumentsPanel supplierId={supplierId} />}

        {((scope === 'project' && !projectId) ||
          (scope === 'tender' && !tenderId) ||
          (scope === 'supplier' && !supplierId)) && (
          <Card>
            <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Sélectionnez un {scope === 'project' ? 'projet' : scope === 'tender' ? "appel d'offres" : 'fournisseur'} pour afficher ses documents.
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AppLayout>
  );
}

interface PickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function ScopePicker({ label, value, onChange, options }: PickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Sélectionner un ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
