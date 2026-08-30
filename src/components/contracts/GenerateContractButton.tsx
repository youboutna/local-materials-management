/**
 * GenerateContractButton — déclencheur explicite « attribution → contrat ».
 * Crée le contrat (CTR-AAAA-XXXX) et fige les lignes du DQE lauréat.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSignature, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getContractService } from '@/application/services/ContractService';
import { useTenderContractsHex } from '@/hooks/hexagonal/useContractsHex';

interface GenerateContractButtonProps {
  projectId?: string | null;
  tenderId: string;
  winningEstimateId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  totalAmount?: number;
  currency?: string;
  projectName?: string | null;
  /** Taux de TVA appliqué aux lignes figées (défaut : 0 = HT). */
  vatRate?: number;
  size?: 'sm' | 'default';
}

export default function GenerateContractButton({
  projectId,
  tenderId,
  winningEstimateId,
  supplierId,
  supplierName,
  totalAmount = 0,
  currency = 'MRU',
  projectName,
  vatRate = 0,
  size = 'sm',
}: GenerateContractButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: contracts = [] } = useTenderContractsHex(tenderId);
  const existing = contracts[0];

  const handleGenerate = async () => {
    if (!projectId) {
      toast.error('Le projet lié doit exister avant de générer le contrat.');
      return;
    }
    setBusy(true);
    try {
      const contract = await getContractService().awardFromAcceptedQuote({
        projectId,
        tenderId,
        supplierId,
        supplierName,
        sourceEstimateId: winningEstimateId ?? null,
        totalAmount,
        currency,
        projectName,
        vatRate,
      });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success(`Contrat ${contract.contractNumber} généré`);
      navigate(`/contracts/${contract.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Génération du contrat impossible');
    } finally {
      setBusy(false);
    }
  };

  if (existing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">{existing.contractNumber}</Badge>
        <Button size={size} variant="outline" onClick={() => navigate(`/contracts/${existing.id}`)}>
          <FileSignature className="mr-1.5 h-4 w-4" /> Ouvrir le contrat
        </Button>
      </div>
    );
  }

  return (
    <Button size={size} onClick={handleGenerate} disabled={busy}>
      {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileSignature className="mr-1.5 h-4 w-4" />}
      Générer le contrat
    </Button>
  );
}
