/**
 * StrategicLinkageStep - UI Component for project-strategy and project-budget linkages
 * Following hexagonal architecture: UI → Hook → Service → Repository → DB
 * 
 * Features:
 * - Autocomplete for SCAPP strategy elements (Levier, Chantier, Intervention, Objective)
 * - Autocomplete for Budget 2026 elements (Ministry, Program, Action, Line)
 * - Contribution percentage and allocation inputs
 * - Accessible and navigable UI
 */
import React, { useState, useCallback, useMemo } from 'react';
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
  type AutocompleteSuggestion,
} from '@/config/referentials/linkage/autocomplete-provider';
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

// Autocomplete Input Component
interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  searchFn: (query: string) => AutocompleteSuggestion[];
  disabled?: boolean;
  parentFilter?: string;
  secondaryLabel?: string;
}

function AutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  searchFn,
  disabled,
  secondaryLabel,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const debouncedQuery = useDebounce(value, 300);

  React.useEffect(() => {
    if (debouncedQuery.length >= 1) {
      const results = searchFn(debouncedQuery);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [debouncedQuery, searchFn]);

  const handleSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.label.fr);
    onSelect(suggestion);
    setIsOpen(false);
  }, [onChange, onSelect]);

  return (
    <div className="relative">
      <Label htmlFor={label} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative mt-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          disabled={disabled}
          className="pl-9"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ScrollArea className="absolute z-50 mt-1 max-h-60 w-full rounded-md border bg-popover shadow-lg">
          <ul role="listbox" className="py-1">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                role="option"
                aria-selected={false}
                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                onClick={() => handleSelect(suggestion)}
              >
                <div>
                  <span className="font-medium">{suggestion.label.fr}</span>
                  {secondaryLabel && (
                    <span className="ml-2 text-muted-foreground">
                      {secondaryLabel}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {suggestion.kind.replace('budget_', '').replace('_', ' ')}
                </Badge>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

export function StrategicLinkageStep({
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

  // Autocomplete state for strategy
  const [leverQuery, setLeverQuery] = useState('');
  const [chantierQuery, setChantierQuery] = useState('');
  const [interventionQuery, setInterventionQuery] = useState('');
  const [objectiveQuery, setObjectiveQuery] = useState('');
  const [contributionPct, setContributionPct] = useState<string>('0');

  // Autocomplete state for budget
  const [ministryQuery, setMinistryQuery] = useState('');
  const [programQuery, setProgramQuery] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [lineQuery, setLineQuery] = useState('');
  const [allocatedCe, setAllocatedCe] = useState<string>('0');
  const [allocatedCp, setAllocatedCp] = useState<string>('0');

  // Selected values
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

    toast.success('Lien budgétaire ajouté');
  }, [projectId, selectedBudget, allocatedCe, allocatedCp, budgetLinks, onBudgetLinksChange]);

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
                      <CardTitle className="text-sm">Ajouter un lien stratégique</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <AutocompleteInput
                          label="Levier"
                          placeholder="Rechercher un levier..."
                          value={leverQuery}
                          onChange={setLeverQuery}
                          onSelect={(s) => {
                            setSelectedStrategy((prev) => ({ ...prev, leverCode: s.id }));
                            setLeverQuery(s.label.fr);
                          }}
                          searchFn={searchLevers}
                          disabled={readOnly}
                        />
                        <AutocompleteInput
                          label="Chantier"
                          placeholder="Rechercher un chantier..."
                          value={chantierQuery}
                          onChange={setChantierQuery}
                          onSelect={(s) => {
                            setSelectedStrategy((prev) => ({
                              ...prev,
                              chantierCode: s.id,
                              leverCode: s.parentCode || prev.leverCode,
                            }));
                            setChantierQuery(s.label.fr);
                          }}
                          searchFn={(q) => searchChantiers(q, selectedStrategy.leverCode)}
                          disabled={readOnly}
                        />
                        <AutocompleteInput
                          label="Intervention"
                          placeholder="Rechercher une intervention..."
                          value={interventionQuery}
                          onChange={setInterventionQuery}
                          onSelect={(s) => {
                            setSelectedStrategy((prev) => ({
                              ...prev,
                              interventionCode: s.id,
                              chantierCode: s.parentCode || prev.chantierCode,
                            }));
                            setInterventionQuery(s.label.fr);
                          }}
                          searchFn={(q) => searchInterventions(q, selectedStrategy.chantierCode)}
                          disabled={readOnly}
                        />
                        <AutocompleteInput
                          label="Objectif"
                          placeholder="Rechercher un objectif..."
                          value={objectiveQuery}
                          onChange={setObjectiveQuery}
                          onSelect={(s) => {
                            setSelectedStrategy((prev) => ({
                              ...prev,
                              objectiveCode: s.id,
                            }));
                            setObjectiveQuery(s.label.fr);
                          }}
                          searchFn={(q) => searchObjectivesSuggestions(q, selectedStrategy.interventionCode)}
                          disabled={readOnly}
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
                      <CardTitle className="text-sm">Ajouter un lien budgétaire</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <AutocompleteInput
                          label="Ministère"
                          placeholder="Rechercher un ministère..."
                          value={ministryQuery}
                          onChange={setMinistryQuery}
                          onSelect={(s) => {
                            setSelectedBudget((prev) => ({ ...prev, ministryCode: s.id }));
                            setMinistryQuery(s.label.fr);
                          }}
                          searchFn={searchBudgetMinistries}
                          disabled={readOnly}
                        />
                        <AutocompleteInput
                          label="Programme"
                          placeholder="Rechercher un programme..."
                          value={programQuery}
                          onChange={setProgramQuery}
                          onSelect={(s) => {
                            setSelectedBudget((prev) => ({
                              ...prev,
                              programCode: s.id,
                              ministryCode: s.parentCode || prev.ministryCode,
                            }));
                            setProgramQuery(s.label.fr);
                          }}
                          searchFn={(q) => searchBudgetPrograms(q, selectedBudget.ministryCode)}
                          disabled={readOnly}
                        />
                        <AutocompleteInput
                          label="Action"
                          placeholder="Rechercher une action..."
                          value={actionQuery}
                          onChange={setActionQuery}
                          onSelect={(s) => {
                            setSelectedBudget((prev) => ({
                              ...prev,
                              actionCode: s.id,
                              programCode: s.parentCode || prev.programCode,
                            }));
                            setActionQuery(s.label.fr);
                          }}
                          searchFn={(q) => searchBudgetActions(q, selectedBudget.programCode)}
                          disabled={readOnly}
                        />
                        <AutocompleteInput
                          label="Ligne budgétaire"
                          placeholder="Rechercher une ligne..."
                          value={lineQuery}
                          onChange={setLineQuery}
                          onSelect={(s) => {
                            setSelectedBudget((prev) => ({
                              ...prev,
                              lineCode: s.id,
                              actionCode: s.parentCode || prev.actionCode,
                            }));
                            setLineQuery(s.label.fr);
                          }}
                          searchFn={(q) => searchBudgetLines(q, selectedBudget.actionCode)}
                          disabled={readOnly}
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
