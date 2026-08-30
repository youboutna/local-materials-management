/**
 * ContractsList — vue globale des contrats d'attribution.
 */
import { AppLayout } from '@/components/layout';
import ContractList from '@/components/contracts/ContractList';

export default function ContractsList() {
  return (
    <AppLayout
      pageTitle="Contrats"
      pageDescription="Contrats issus des attributions d'appels d'offres"
    >
      <div className="mt-4">
        <ContractList title="Tous les contrats" />
      </div>
    </AppLayout>
  );
}
