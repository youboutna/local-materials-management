/**
 * MappingModal — assistant de mapping partagé (colonnes fichier → BoqLineDTO)
 * consommé par BoqImportDialog, portail fournisseur (import facture) et
 * l'AdvancedQuantityCalculator quand un fichier est ingéré via UnifiedBoqParser.
 *
 * Composant présentation pur : reçoit `columns`, `mapping`, `onChange`.
 */
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
import { T } from '@/components/i18n/T';

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
        <DialogHeader>
          <DialogTitle>Correspondance colonnes → champs</DialogTitle>
          <DialogDescription><T k="auto.mappingmodal.associez_chaque_colonne_du_fichier_au_champ_meti" fallback="Associez chaque colonne du fichier au champ métier correspondant." /></DialogDescription>
        </DialogHeader>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}><T k="auto.mappingmodal.annuler" fallback="Annuler" /></Button>
          <Button onClick={onConfirm}><T k="auto.mappingmodal.valider" fallback="Valider" /></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MappingModal;
