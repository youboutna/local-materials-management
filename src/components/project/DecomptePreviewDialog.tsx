import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generatePVPDF } from '@/lib/pvGenerator';
import { T } from '@/components/i18n/T';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  decompte: Record<string, any> | null;
  phaseName?: string;
  onCreate: () => Promise<void> | void;
}

export const DecomptePreviewDialog: React.FC<Props> = ({ open, onOpenChange, decompte, phaseName, onCreate }) => {
  if (!decompte) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle><T k="auto.decomptepreviewdialog.previsualisation_decompte" fallback="Prévisualisation décompte" /></DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent>
            <p className="font-medium">Phase: {phaseName}</p>
            <p className="text-sm">Pourcentage payable: {decompte.payablePercentage}%</p>
            <p className="text-sm">Net à payer: {decompte.netPayable}</p>
          </CardContent>
        </Card>

        <div className="flex gap-2 mt-4">
          <Button onClick={() => { if (decompte) generatePVPDF({ title: 'PV de réception', phaseName: phaseName || 'Phase', decompte }); }}><T k="auto.decomptepreviewdialog.generer_pv_pdf" fallback="Générer PV (PDF)" /></Button>
          <Button variant="default" onClick={async () => { await onCreate(); }}><T k="auto.decomptepreviewdialog.enregistrer_decompte" fallback="Enregistrer décompte" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecomptePreviewDialog;
