import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { AppLayout } from '@/components/layout';
import { useProjectsHex, useTenders } from '@/hooks/hexagonal';
import { TenderDocumentsPanel } from '@/components/tenders/TenderDocumentsPanel';
import {
  ProjectDocumentsPanel,
  SupplierDocumentsPanel,
} from '@/components/documents/panels';
import { useSuppliersList } from '@/hooks/hexagonal/useSuppliersCrudHex';
import { FolderKanban, Gavel, Truck, ShieldCheck, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { T } from '@/components/i18n/T';

type Scope = 'project' | 'tender' | 'supplier';

const SCOPES: { id: Scope; labelKey: string; icon: any; descriptionKey: string }[] = [
  { id: 'project', labelKey: 'auto.documents.scope.project', icon: FolderKanban, descriptionKey: 'auto.documents.scope.project_desc' },
  { id: 'tender', labelKey: 'auto.documents.scope.tender', icon: Gavel, descriptionKey: 'auto.documents.scope.tender_desc' },
  { id: 'supplier', labelKey: 'auto.documents.scope.supplier', icon: Truck, descriptionKey: 'auto.documents.scope.supplier_desc' },
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
  const { t } = useLanguage();

  const { projects = [] } = useProjectsHex();
  const { data: tenders = [] } = useTenders();
  const { data: suppliers = [] } = useSuppliers();

  const currentPicker = useMemo(() => {
    switch (scope) {
      case 'project':
        return (
          <ScopePicker
            label={t('auto.documents.scope.project')}
            value={projectId}
            onChange={setProjectId}
            options={(projects as any[]).map((p) => ({ value: p.id, label: p.title }))}
          />
        );
      case 'tender':
        return (
          <ScopePicker
            label={t('auto.documents.scope.tender')}
            value={tenderId}
            onChange={setTenderId}
            options={(tenders as any[]).map((tender) => ({
              value: tender.id,
              label: `${tender.tender_number ? `[${tender.tender_number}] ` : ''}${tender.title}`,
            }))}
          />
        );
      case 'supplier':
        return (
          <ScopePicker
            label={t('auto.documents.scope.supplier')}
            value={supplierId}
            onChange={setSupplierId}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
        );
    }
  }, [scope, projectId, tenderId, supplierId, projects, tenders, suppliers, t]);

  const activeTender = (tenders as any[]).find((tender) => tender.id === tenderId);

  return (
    <AppLayout pageTitle={t('auto.documents.title')}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-base"><T k="auto.documents.gestion_electronique_des_documents_ged" fallback="Gestion électronique des documents (GED)" /></CardTitle>
            </div>
            <CardDescription>{t('auto.documents.ged_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-3">
                {SCOPES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <TabsTrigger key={s.id} value={s.id} className="gap-2">
                      <Icon className="h-4 w-4" />
                      {t(s.labelKey)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {SCOPES.map((s) => (
                <TabsContent key={s.id} value={s.id} className="pt-3">
                  <p className="mb-3 text-sm text-muted-foreground">{t(s.descriptionKey)}</p>
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
              {t('auto.documents.empty_state')}
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

/** Combobox avec autocomplétion — indispensable dès que la liste dépasse quelques dizaines d'entrées. */
function ScopePicker({ label, value, onChange, options }: PickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? selected.label : t('auto.documents.picker.placeholder')}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(itemValue, search) =>
              itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder={t('auto.documents.picker.search')} />
            <CommandList>
              <CommandEmpty>{t('auto.documents.picker.empty')}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === o.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{o.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

