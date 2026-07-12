/**
 * MappingModal — assistant de mapping partagé (colonnes fichier → BoqLineDTO)
 * consommé par BoqImportDialog, portail fournisseur (import facture) et
 * l'AdvancedQuantityCalculator quand un fichier est ingéré via UnifiedBoqParser.
 *
 * Composant présentation pur : reçoit `columns`, `mapping`, `onChange`.
 */
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';

export const MAPPING_FIELDS: { key: keyof ImportMapping; label: string }[] = [
  { key: 'designation', label: 'Désignation' },
  { key: 'unit', label: 'Unité' },
  { key: 'quantity', label: 'Quantité' },
  { key: 'unitPrice', label: 'Prix unitaire' },
  { key: 'length', label: 'Longueur' },
  { key: 'width', label: 'Largeur' },
  { key: 'height', label: 'Hauteur' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  columns: string[];
  mapping: ImportMapping;
  onChange: (m: ImportMapping) => void;
  onConfirm: () => void;
}

export const MappingModal: React.FC<Props> = ({ open, onOpenChange, columns, mapping, onChange, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Correspondance colonnes → champs</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {MAPPING_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 items-center gap-2">
              <Label className="text-sm">{label}</Label>
              <div className="col-span-2">
                <Select
                  value={(mapping[key] as string) ?? '__none__'}
                  onValueChange={(v) => onChange({ ...mapping, [key]: v === '__none__' ? undefined : v })}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Ignorer —</SelectItem>
                    {columns.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onConfirm}>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MappingModal;
