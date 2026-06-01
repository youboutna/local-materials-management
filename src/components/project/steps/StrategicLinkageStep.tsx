/**
 * StrategicLinkageStep - UI Component for project-strategy and project-budget linkages
 * Following hexagonal architecture: UI → Hook → Service → Repository → DB
 * 
 * Features:
 * - Cascading autocomplete for SCAPP strategy elements (Levier → Chantier → Intervention → Objective)
 * - Cascading autocomplete for Budget 2026 elements (Ministry → Program → Action → Line)
 * - Auto-populate children when parent is selected
 * - Visual hierarchy breadcrumb trail
 * - Selected item details panel
 * - Contribution percentage and allocation inputs
 * - Accessible and navigable UI
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectStrategyLinkHex } from '@/hooks/hexagonal/useProjectStrategyLinkHex';
import { useProjectBudgetLinkHex } from '@/hooks/hexagonal/useProjectBudgetLinkHex';
import {
  searchLevers,
  searchChantiers,
  searchInterventions,
  searchObjectivesSuggestions,
  searchBudgetMinistries,
  searchBudgetPrograms,
  searchBudgetActions,
  searchBudgetLines,
  linkageHelpers,
  type AutocompleteSuggestion,
} from '@/config/referentials/linkage/autocomplete-provider';
import {
  scappNationalStrategy,
  type StrategicLever,
} from '@/config/referentials/strategies/scapp-national-strategy.referential';
import type { CreateProjectStrategyLinkDTO } from '@/dtos/entities/ProjectStrategyLinkDTO';
import type { CreateProjectBudgetLinkDTO } from '@/dtos/entities/ProjectBudgetLinkDTO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Trash2,
  Target,
  Landmark,
  AlertCircle,
  CheckCircle2,
  Search,
  Loader2,
  ChevronRight,
  Info,
  Layers,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';

interface StrategicLinkageStepProps {
  projectId: string;
  initialStrategyLinks?: CreateProjectStrategyLinkDTO[];
  initialBudgetLinks?: CreateProjectBudgetLinkDTO[];
  onStrategyLinksChange?: (links: CreateProjectStrategyLinkDTO[]) => void;
  onBudgetLinksChange?: (links: CreateProjectBudgetLinkDTO[]) => void;
  readOnly?: boolean;
}

// Type for search functions that can accept optional parent code or limit
type SearchFunction = 
  | ((query: string, limit?: number) => AutocompleteSuggestion[])
  | ((query: string, parentCode?: string, limit?: number) => AutocompleteSuggestion[]);

// Cascading Autocomplete Input Component
interface CascadingAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  searchFn: SearchFunction;
  parentCode?: string;
  disabled?: boolean;
  level: number; // 1 = root, 2 = first child, etc.
  childrenCount?: number; // Number of children available
  selectedSuggestion?: AutocompleteSuggestion | null;
  onClear?: () => void;
  secondaryLabel?: string; // Optional secondary label (e.g., "ODD")
}

function CascadingAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  searchFn,
  parentCode,
  disabled,
  level,
  childrenCount,
  selectedSuggestion,
  onClear,
}: CascadingAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const listboxId = useMemo(() => `lb-${label.replace(/\s+/g, '-')}`, [label]);
  const debouncedQuery = useDebounce(value, 300);

  // Helper to call searchFn with appropriate arguments based on whether parentCode is needed
  const callSearchFn = useCallback((query: string, parent?: string): AutocompleteSuggestion[] => {
    if (parent) {
      return (searchFn as (q: string, p?: string, l?: number) => AutocompleteSuggestion[])(query, parent, 20);
    } else {
      return (searchFn as (q: string, l?: number) => AutocompleteSuggestion[])(query, 20);
    }
  }, [searchFn]);

  // Fetch suggestions when query or parent changes
  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      const results = callSearchFn(debouncedQuery, parentCode);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(results.length > 0 ? 0 : -1);
    } else if (parentCode && !value) {
      const results = callSearchFn('', parentCode);
      setSuggestions(results);
      if (results.length > 0 && results.length <= 10) {
        setIsOpen(true);
        setActiveIndex(0);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }, [debouncedQuery, callSearchFn, parentCode, value]);

  const handleSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.label.fr);
    onSelect(suggestion);
    setIsOpen(false);
    setActiveIndex(-1);
  }, [onChange, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && suggestions.length > 0) {
      setIsOpen(true);
      setActiveIndex(0);
      e.preventDefault();
      return;
    }
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(suggestions.length - 1);
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [isOpen, suggestions, activeIndex, handleSelect]);

  // Level colors for visual hierarchy
  const levelColors = [
    'border-l-blue-500',
    'border-l-green-500',
    'border-l-amber-500',
    'border-l-purple-500',
  ];

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className={`relative border-l-2 pl-3 ${levelColors[level % 4]}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={label} className="text-sm font-medium flex items-center gap-2">
          {label}
          {childrenCount !== undefined && childrenCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {childrenCount} options
            </Badge>
          )}
        </Label>
        {selectedSuggestion && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-xs text-muted-foreground"
            aria-label={`Effacer ${label}`}
          >
            Effacer
          </Button>
        )}
      </div>
      <div className="relative mt-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={label}
          placeholder={parentCode && !value ? `${childrenCount || 0} options disponibles` : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-9"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          role="combobox"
        />
      </div>

      {/* Selected item details */}
      {selectedSuggestion && !isOpen && (
        <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <div className="font-medium">{selectedSuggestion.label.fr}</div>
              {selectedSuggestion.secondaryLabel && (
                <div className="text-muted-foreground">{selectedSuggestion.secondaryLabel}</div>
              )}
              {selectedSuggestion.metadata && (
                <div className="mt-1 text-muted-foreground">
                  {selectedSuggestion.metadata.unit && <span>Unité: {selectedSuggestion.metadata.unit}</span>}
                  {selectedSuggestion.metadata.target2030 && (
                    <span className="ml-2">Cible 2030: {selectedSuggestion.metadata.target2030}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ScrollArea className="absolute z-50 mt-1 max-h-60 w-full rounded-md border bg-popover shadow-lg">
          <ul id={listboxId} role="listbox" aria-label={label} className="py-1">
            {suggestions.map((suggestion, idx) => (
              <li
                key={suggestion.id}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent ${idx === activeIndex ? 'bg-accent' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
              >
                <div className="flex-1">
                  <span className="font-medium">{suggestion.label.fr}</span>
                  {suggestion.secondaryLabel && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      {suggestion.secondaryLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {suggestion.metadata?.totalCE && (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.metadata.totalCE.toLocaleString()} CE
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {suggestion.kind.replace('budget_', '').replace('_', ' ')}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

// Hierarchy Breadcrumb Component
interface HierarchyBreadcrumbProps {
  items: Array<{ code: string; label: string; kind: string }>;
  onNavigate?: (index: number) => void;
}

function HierarchyBreadcrumb({ items, onNavigate }: HierarchyBreadcrumbProps) {
  if (items.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3 flex-wrap">
      <FolderTree className="h-4 w-4" />
      {items.map((item, index) => (
        <React.Fragment key={item.code}>
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          <Badge
            variant={index === items.length - 1 ? 'default' : 'secondary'}
            className="cursor-pointer text-xs"
            onClick={() => onNavigate?.(index)}
          >
            {item.label}
          </Badge>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function StrategicLinkageStep({
  projectId,
  initialStrategyLinks = [],
  initialBudgetLinks = [],
  onStrategyLinksChange,
  onBudgetLinksChange,
  readOnly = false,
}: StrategicLinkageStepProps) {
  // State for strategy links
  const [strategyLinks, setStrategyLinks] = useState<CreateProjectStrategyLinkDTO[]>(initialStrategyLinks);
  
  // State for budget links
  const [budgetLinks, setBudgetLinks] = useState<CreateProjectBudgetLinkDTO[]>(initialBudgetLinks);

  // Hooks for persistence
  const { useBatchCreateLinks: useBatchCreateStrategyLinks } = useProjectStrategyLinkHex(projectId);
  const { useBatchCreateLinks: useBatchCreateBudgetLinks } = useProjectBudgetLinkHex(projectId);
  
  const batchCreateStrategyMutation = useBatchCreateStrategyLinks();
  const batchCreateBudgetMutation = useBatchCreateBudgetLinks();

  // Autocomplete state for strategy - with selected suggestions for details panel
  const [leverQuery, setLeverQuery] = useState('');
  const [chantierQuery, setChantierQuery] = useState('');
  const [interventionQuery, setInterventionQuery] = useState('');
  const [objectiveQuery, setObjectiveQuery] = useState('');
  const [contributionPct, setContributionPct] = useState<string>('0');
  
  // Selected suggestion objects (for displaying details)
  const [selectedLever, setSelectedLever] = useState<AutocompleteSuggestion | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<AutocompleteSuggestion | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<AutocompleteSuggestion | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<AutocompleteSuggestion | null>(null);

  // Autocomplete state for budget
  const [ministryQuery, setMinistryQuery] = useState('');
  const [programQuery, setProgramQuery] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [lineQuery, setLineQuery] = useState('');
  const [allocatedCe, setAllocatedCe] = useState<string>('0');
  const [allocatedCp, setAllocatedCp] = useState<string>('0');
  
  // Selected budget suggestion objects
  const [selectedMinistry, setSelectedMinistry] = useState<AutocompleteSuggestion | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<AutocompleteSuggestion | null>(null);
  const [selectedAction, setSelectedAction] = useState<AutocompleteSuggestion | null>(null);
  const [selectedLine, setSelectedLine] = useState<AutocompleteSuggestion | null>(null);

  // Selected values codes
  const [selectedStrategy, setSelectedStrategy] = useState<{
    leverCode?: string;
    chantierCode?: string;
    interventionCode?: string;
    objectiveCode?: string;
  }>({});

  const [selectedBudget, setSelectedBudget] = useState<{
    ministryCode?: string;
    programCode?: string;
    actionCode?: string;
    lineCode?: string;
  }>({});

  // Get children counts for cascading indicators
  const strategyHierarchy = useMemo(() => {
    const items: Array<{ code: string; label: string; kind: string }> = [];
    if (selectedLever) items.push({ code: selectedLever.id, label: selectedLever.label.fr, kind: 'lever' });
    if (selectedChantier) items.push({ code: selectedChantier.id, label: selectedChantier.label.fr, kind: 'chantier' });
    if (selectedIntervention) items.push({ code: selectedIntervention.id, label: selectedIntervention.label.fr, kind: 'intervention' });
    if (selectedObjective) items.push({ code: selectedObjective.id, label: selectedObjective.label.fr, kind: 'objective' });
    return items;
  }, [selectedLever, selectedChantier, selectedIntervention, selectedObjective]);

  const budgetHierarchy = useMemo(() => {
    const items: Array<{ code: string; label: string; kind: string }> = [];
    if (selectedMinistry) items.push({ code: selectedMinistry.id, label: selectedMinistry.label.fr, kind: 'ministry' });
    if (selectedProgram) items.push({ code: selectedProgram.id, label: selectedProgram.label.fr, kind: 'program' });
    if (selectedAction) items.push({ code: selectedAction.id, label: selectedAction.label.fr, kind: 'action' });
    if (selectedLine) items.push({ code: selectedLine.id, label: selectedLine.label.fr, kind: 'line' });
    return items;
  }, [selectedMinistry, selectedProgram, selectedAction, selectedLine]);

  // Get children counts
  const getChantierCount = useCallback((leverCode: string): number => {
    const lever = scappNationalStrategy.find((l: StrategicLever) => l.code === leverCode);
    return lever?.chantiers.length || 0;
  }, []);

  const getInterventionCount = useCallback((chantierCode: string): number => {
    for (const lever of scappNationalStrategy) {
      const chantier = lever.chantiers.find(c => c.code === chantierCode);
      if (chantier) return chantier.interventions.length;
    }
    return 0;
  }, []);

  const getObjectiveCount = useCallback((interventionCode: string): number => {
    for (const lever of scappNationalStrategy) {
      for (const chantier of lever.chantiers) {
        const intervention = chantier.interventions.find(i => i.code === interventionCode);
        if (intervention) return intervention.objectives.length;
      }
    }
    return 0;
  }, []);

  // Calculate total contribution
  const totalContribution = useMemo(() => {
    return strategyLinks.reduce((sum, link) => sum + (link.contributionPct || 0), 0);
  }, [strategyLinks]);

  // Calculate total allocations
  const totalAllocations = useMemo(() => {
    return {
      ce: budgetLinks.reduce((sum, link) => sum + (link.allocatedCe || 0), 0),
      cp: budgetLinks.reduce((sum, link) => sum + (link.allocatedCp || 0), 0),
    };
  }, [budgetLinks]);

  // Add strategy link
  const handleAddStrategyLink = useCallback(() => {
    if (!selectedStrategy.objectiveCode && !selectedStrategy.interventionCode) {
      toast.error('Veuillez sélectionner au moins un objectif ou une intervention');
      return;
    }

    const newLink: CreateProjectStrategyLinkDTO = {
      projectId,
      sourceReferential: 'SCAPP',
      leverCode: selectedStrategy.leverCode || null,
      chantierCode: selectedStrategy.chantierCode || null,
      interventionCode: selectedStrategy.interventionCode || null,
      objectiveCode: selectedStrategy.objectiveCode || null,
      contributionPct: parseFloat(contributionPct) || 0,
    };

    const updatedLinks = [...strategyLinks, newLink];
    setStrategyLinks(updatedLinks);
    onStrategyLinksChange?.(updatedLinks);

    // Reset form
    setLeverQuery('');
    setChantierQuery('');
    setInterventionQuery('');
    setObjectiveQuery('');
    setContributionPct('0');
    setSelectedStrategy({});
    setSelectedLever(null);
    setSelectedChantier(null);
    setSelectedIntervention(null);
    setSelectedObjective(null);

    toast.success('Lien stratégique ajouté');
  }, [projectId, selectedStrategy, contributionPct, strategyLinks, onStrategyLinksChange]);

  // Add budget link
  const handleAddBudgetLink = useCallback(() => {
    if (!selectedBudget.ministryCode && !selectedBudget.programCode) {
      toast.error('Veuillez sélectionner au moins un ministère ou un programme');
      return;
    }

    const newLink: CreateProjectBudgetLinkDTO = {
      projectId,
      ministryCode: selectedBudget.ministryCode || null,
      programCode: selectedBudget.programCode || null,
      actionCode: selectedBudget.actionCode || null,
      lineCode: selectedBudget.lineCode || null,
      allocatedCe: parseFloat(allocatedCe) || 0,
      allocatedCp: parseFloat(allocatedCp) || 0,
      fiscalYear: 2026,
    };

    const updatedLinks = [...budgetLinks, newLink];
    setBudgetLinks(updatedLinks);
    onBudgetLinksChange?.(updatedLinks);

    // Reset form
    setMinistryQuery('');
    setProgramQuery('');
    setActionQuery('');
    setLineQuery('');
    setAllocatedCe('0');
    setAllocatedCp('0');
    setSelectedBudget({});
    setSelectedMinistry(null);
    setSelectedProgram(null);
    setSelectedAction(null);
    setSelectedLine(null);

    toast.success('Lien budgétaire ajouté');
  }, [projectId, selectedBudget, allocatedCe, allocatedCp, budgetLinks, onBudgetLinksChange]);
  
  // Cascading selection handlers for strategy
  const handleLeverSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    // Reset all children when lever changes
    setLeverQuery(suggestion.label.fr);
    setSelectedLever(suggestion);
    setChantierQuery('');
    setSelectedChantier(null);
    setInterventionQuery('');
    setSelectedIntervention(null);
    setObjectiveQuery('');
    setSelectedObjective(null);
    setSelectedStrategy({ leverCode: suggestion.id });
    
    // Show toast with children count
    const childrenCount = getChantierCount(suggestion.id);
    if (childrenCount > 0) {
      toast.info(`${childrenCount} chantiers disponibles`);
    }
  }, [getChantierCount]);

  const handleChantierSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    // Reset children when chantier changes
    setChantierQuery(suggestion.label.fr);
    setSelectedChantier(suggestion);
    setInterventionQuery('');
    setSelectedIntervention(null);
    setObjectiveQuery('');
    setSelectedObjective(null);
    setSelectedStrategy(prev => ({
      ...prev,
      leverCode: prev.leverCode || suggestion.parentCode,
      chantierCode: suggestion.id,
    }));
    
    const childrenCount = getInterventionCount(suggestion.id);
    if (childrenCount > 0) {
      toast.info(`${childrenCount} interventions disponibles`);
    }
  }, [getInterventionCount]);

  const handleInterventionSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    // Reset children when intervention changes
    setInterventionQuery(suggestion.label.fr);
    setSelectedIntervention(suggestion);
    setObjectiveQuery('');
    setSelectedObjective(null);
    setSelectedStrategy(prev => ({
      ...prev,
      chantierCode: prev.chantierCode || suggestion.parentCode,
      interventionCode: suggestion.id,
    }));
    
    const childrenCount = getObjectiveCount(suggestion.id);
    if (childrenCount > 0) {
      toast.info(`${childrenCount} objectifs disponibles`);
    }
  }, [getObjectiveCount]);

  const handleObjectiveSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    setObjectiveQuery(suggestion.label.fr);
    setSelectedObjective(suggestion);
    setSelectedStrategy(prev => ({
      ...prev,
      interventionCode: prev.interventionCode || suggestion.parentCode,
      objectiveCode: suggestion.id,
    }));
  }, []);
  
  // Cascading selection handlers for budget
  const handleMinistrySelect = useCallback((suggestion: AutocompleteSuggestion) => {
    // Reset all children when ministry changes
    setMinistryQuery(suggestion.label.fr);
    setSelectedMinistry(suggestion);
    setProgramQuery('');
    setSelectedProgram(null);
    setActionQuery('');
    setSelectedAction(null);
    setLineQuery('');
    setSelectedLine(null);
    setSelectedBudget({ ministryCode: suggestion.id });
  }, []);

  const handleProgramSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    // Reset children when program changes
    setProgramQuery(suggestion.label.fr);
    setSelectedProgram(suggestion);
    setActionQuery('');
    setSelectedAction(null);
    setLineQuery('');
    setSelectedLine(null);
    setSelectedBudget(prev => ({
      ...prev,
      ministryCode: prev.ministryCode || suggestion.parentCode,
      programCode: suggestion.id,
    }));
  }, []);

  const handleActionSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    // Reset children when action changes
    setActionQuery(suggestion.label.fr);
    setSelectedAction(suggestion);
    setLineQuery('');
    setSelectedLine(null);
    setSelectedBudget(prev => ({
      ...prev,
      programCode: prev.programCode || suggestion.parentCode,
      actionCode: suggestion.id,
    }));
  }, []);

  const handleLineSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    setLineQuery(suggestion.label.fr);
    setSelectedLine(suggestion);
    setSelectedBudget(prev => ({
      ...prev,
      actionCode: prev.actionCode || suggestion.parentCode,
      lineCode: suggestion.id,
    }));
  }, []);

  // Remove strategy link
  const handleRemoveStrategyLink = useCallback((index: number) => {
    const updatedLinks = strategyLinks.filter((_, i) => i !== index);
    setStrategyLinks(updatedLinks);
    onStrategyLinksChange?.(updatedLinks);
  }, [strategyLinks, onStrategyLinksChange]);

  // Remove budget link
  const handleRemoveBudgetLink = useCallback((index: number) => {
    const updatedLinks = budgetLinks.filter((_, i) => i !== index);
    setBudgetLinks(updatedLinks);
    onBudgetLinksChange?.(updatedLinks);
  }, [budgetLinks, onBudgetLinksChange]);

  // Save all links
  const handleSaveAll = useCallback(async () => {
    try {
      if (strategyLinks.length > 0) {
        await batchCreateStrategyMutation.mutateAsync(strategyLinks);
      }
      if (budgetLinks.length > 0) {
        await batchCreateBudgetMutation.mutateAsync(budgetLinks);
      }
      toast.success('Tous les liens ont été sauvegardés');
    } catch (error) {
      console.error('Error saving links:', error);
      toast.error('Erreur lors de la sauvegarde des liens');
    }
  }, [strategyLinks, budgetLinks, batchCreateStrategyMutation, batchCreateBudgetMutation]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Liaisons Stratégiques et Budgétaires
            </CardTitle>
            <CardDescription>
              Liez ce projet aux objectifs stratégiques (SCAPP) et aux lignes budgétaires (Loi de Finances 2026)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="strategy" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Stratégie SCAPP
                  {strategyLinks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {strategyLinks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="budget" className="flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Budget 2026
                  {budgetLinks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {budgetLinks.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Strategy Tab */}
              <TabsContent value="strategy" className="space-y-4">
                {!readOnly && (
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FolderTree className="h-4 w-4" />
                        Ajouter un lien stratégique
                      </CardTitle>
                      <CardDescription>
                        Sélection en cascade: chaque niveau filtre automatiquement les options suivantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Hierarchy Breadcrumb */}
                      {strategyHierarchy.length > 0 && (
                        <HierarchyBreadcrumb items={strategyHierarchy} />
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <CascadingAutocomplete
                          label="Levier"
                          placeholder="Rechercher un levier..."
                          value={leverQuery}
                          onChange={setLeverQuery}
                          onSelect={handleLeverSelect}
                          searchFn={searchLevers}
                          disabled={readOnly}
                          level={1}
                          childrenCount={selectedLever ? getChantierCount(selectedLever.id) : undefined}
                          selectedSuggestion={selectedLever}
                          onClear={() => {
                            setLeverQuery('');
                            setSelectedLever(null);
                            setSelectedStrategy({});
                          }}
                        />
                        <CascadingAutocomplete
                          label="Chantier"
                          placeholder={selectedLever ? "Filtré par levier sélectionné..." : "Sélectionnez d'abord un levier"}
                          value={chantierQuery}
                          onChange={setChantierQuery}
                          onSelect={handleChantierSelect}
                          searchFn={(q) => searchChantiers(q, selectedStrategy.leverCode)}
                          parentCode={selectedStrategy.leverCode}
                          disabled={readOnly || !selectedStrategy.leverCode}
                          level={2}
                          childrenCount={selectedChantier ? getInterventionCount(selectedChantier.id) : undefined}
                          selectedSuggestion={selectedChantier}
                          onClear={() => {
                            setChantierQuery('');
                            setSelectedChantier(null);
                            setSelectedStrategy(prev => ({ leverCode: prev.leverCode }));
                          }}
                        />
                        <CascadingAutocomplete
                          label="Intervention"
                          placeholder={selectedChantier ? "Filtré par chantier sélectionné..." : "Sélectionnez d'abord un chantier"}
                          value={interventionQuery}
                          onChange={setInterventionQuery}
                          onSelect={handleInterventionSelect}
                          searchFn={(q) => searchInterventions(q, selectedStrategy.chantierCode)}
                          parentCode={selectedStrategy.chantierCode}
                          disabled={readOnly || !selectedStrategy.chantierCode}
                          level={3}
                          childrenCount={selectedIntervention ? getObjectiveCount(selectedIntervention.id) : undefined}
                          selectedSuggestion={selectedIntervention}
                          onClear={() => {
                            setInterventionQuery('');
                            setSelectedIntervention(null);
                            setSelectedStrategy(prev => ({ leverCode: prev.leverCode, chantierCode: prev.chantierCode }));
                          }}
                        />
                        <CascadingAutocomplete
                          label="Objectif"
                          placeholder={selectedIntervention ? "Filtré par intervention sélectionnée..." : "Sélectionnez d'abord une intervention"}
                          value={objectiveQuery}
                          onChange={setObjectiveQuery}
                          onSelect={handleObjectiveSelect}
                          searchFn={(q) => searchObjectivesSuggestions(q, selectedStrategy.interventionCode)}
                          parentCode={selectedStrategy.interventionCode}
                          disabled={readOnly || !selectedStrategy.interventionCode}
                          level={4}
                          selectedSuggestion={selectedObjective}
                          onClear={() => {
                            setObjectiveQuery('');
                            setSelectedObjective(null);
                            setSelectedStrategy(prev => ({ ...prev, interventionCode: prev.interventionCode }));
                          }}
                          secondaryLabel="ODD"
                        />
                      </div>
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <Label htmlFor="contribution">Contribution (%)</Label>
                          <Input
                            id="contribution"
                            type="number"
                            min={0}
                            max={100}
                            value={contributionPct}
                            onChange={(e) => setContributionPct(e.target.value)}
                            disabled={readOnly}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={handleAddStrategyLink}
                          disabled={readOnly}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
                      {totalContribution > 100 && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          La contribution totale dépasse 100%
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Strategy Links List */}
                {strategyLinks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Liens stratégiques ({strategyLinks.length})</Label>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(totalContribution, 100)} className="w-24" />
                        <span className="text-sm text-muted-foreground">{totalContribution}%</span>
                      </div>
                    </div>
                    <ScrollArea className="h-48 rounded-md border">
                      <ul className="divide-y">
                        {strategyLinks.map((link, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between p-3 hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {link.leverCode && (
                                  <Badge variant="outline">{link.leverCode}</Badge>
                                )}
                                {link.chantierCode && (
                                  <Badge variant="outline">{link.chantierCode}</Badge>
                                )}
                                {link.interventionCode && (
                                  <Badge variant="outline">{link.interventionCode}</Badge>
                                )}
                                {link.objectiveCode && (
                                  <Badge variant="secondary">{link.objectiveCode}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{link.contributionPct}%</Badge>
                              {!readOnly && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveStrategyLink(index)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Supprimer</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              {/* Budget Tab */}
              <TabsContent value="budget" className="space-y-4">
                {!readOnly && (
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Ajouter un lien budgétaire
                      </CardTitle>
                      <CardDescription>
                        Sélection en cascade: chaque niveau filtre automatiquement les options suivantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Hierarchy Breadcrumb */}
                      {budgetHierarchy.length > 0 && (
                        <HierarchyBreadcrumb items={budgetHierarchy} />
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <CascadingAutocomplete
                          label="Ministère"
                          placeholder="Rechercher un ministère..."
                          value={ministryQuery}
                          onChange={setMinistryQuery}
                          onSelect={handleMinistrySelect}
                          searchFn={searchBudgetMinistries}
                          disabled={readOnly}
                          level={1}
                          selectedSuggestion={selectedMinistry}
                          onClear={() => {
                            setMinistryQuery('');
                            setSelectedMinistry(null);
                            setSelectedBudget({});
                          }}
                        />
                        <CascadingAutocomplete
                          label="Programme"
                          placeholder={selectedMinistry ? "Filtré par ministère sélectionné..." : "Sélectionnez d'abord un ministère"}
                          value={programQuery}
                          onChange={setProgramQuery}
                          onSelect={handleProgramSelect}
                          searchFn={(q) => searchBudgetPrograms(q, selectedBudget.ministryCode)}
                          parentCode={selectedBudget.ministryCode}
                          disabled={readOnly || !selectedBudget.ministryCode}
                          level={2}
                          selectedSuggestion={selectedProgram}
                          onClear={() => {
                            setProgramQuery('');
                            setSelectedProgram(null);
                            setSelectedBudget(prev => ({ ministryCode: prev.ministryCode }));
                          }}
                        />
                        <CascadingAutocomplete
                          label="Action"
                          placeholder={selectedProgram ? "Filtré par programme sélectionné..." : "Sélectionnez d'abord un programme"}
                          value={actionQuery}
                          onChange={setActionQuery}
                          onSelect={handleActionSelect}
                          searchFn={(q) => searchBudgetActions(q, selectedBudget.programCode)}
                          parentCode={selectedBudget.programCode}
                          disabled={readOnly || !selectedBudget.programCode}
                          level={3}
                          selectedSuggestion={selectedAction}
                          onClear={() => {
                            setActionQuery('');
                            setSelectedAction(null);
                            setSelectedBudget(prev => ({ ministryCode: prev.ministryCode, programCode: prev.programCode }));
                          }}
                        />
                        <CascadingAutocomplete
                          label="Ligne budgétaire"
                          placeholder={selectedAction ? "Filtré par action sélectionnée..." : "Sélectionnez d'abord une action"}
                          value={lineQuery}
                          onChange={setLineQuery}
                          onSelect={handleLineSelect}
                          searchFn={(q) => searchBudgetLines(q, selectedBudget.actionCode)}
                          parentCode={selectedBudget.actionCode}
                          disabled={readOnly || !selectedBudget.actionCode}
                          level={4}
                          selectedSuggestion={selectedLine}
                          onClear={() => {
                            setLineQuery('');
                            setSelectedLine(null);
                            setSelectedBudget(prev => ({ ...prev, actionCode: prev.actionCode }));
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="allocatedCe">Crédits d'Engagement (CE)</Label>
                          <Input
                            id="allocatedCe"
                            type="number"
                            min={0}
                            value={allocatedCe}
                            onChange={(e) => setAllocatedCe(e.target.value)}
                            disabled={readOnly}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="allocatedCp">Crédits de Paiement (CP)</Label>
                          <Input
                            id="allocatedCp"
                            type="number"
                            min={0}
                            value={allocatedCp}
                            onChange={(e) => setAllocatedCp(e.target.value)}
                            disabled={readOnly}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleAddBudgetLink}
                        disabled={readOnly}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Budget Links List */}
                {budgetLinks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Liens budgétaires ({budgetLinks.length})</Label>
                      <div className="text-sm text-muted-foreground">
                        Total: {totalAllocations.ce.toLocaleString()} CE / {totalAllocations.cp.toLocaleString()} CP
                      </div>
                    </div>
                    <ScrollArea className="h-48 rounded-md border">
                      <ul className="divide-y">
                        {budgetLinks.map((link, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between p-3 hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {link.ministryCode && (
                                  <Badge variant="outline">{link.ministryCode}</Badge>
                                )}
                                {link.programCode && (
                                  <Badge variant="outline">{link.programCode}</Badge>
                                )}
                                {link.actionCode && (
                                  <Badge variant="outline">{link.actionCode}</Badge>
                                )}
                                {link.lineCode && (
                                  <Badge variant="secondary">{link.lineCode}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right text-sm">
                                <div>{link.allocatedCe?.toLocaleString()} CE</div>
                                <div className="text-muted-foreground">{link.allocatedCp?.toLocaleString()} CP</div>
                              </div>
                              {!readOnly && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveBudgetLink(index)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Supprimer</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            {!readOnly && (strategyLinks.length > 0 || budgetLinks.length > 0) && (
              <>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAll}
                    disabled={batchCreateStrategyMutation.isPending || batchCreateBudgetMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {batchCreateStrategyMutation.isPending || batchCreateBudgetMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Sauvegarder les liens
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
