import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ban, Shield, Clock, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePaymentStatsHex } from '@/hooks/hexagonal';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const EnhancedPaymentBlockingInterface = () => {
  const { t } = useLanguage();
  // ✅ Défaut de tableau vide pour éviter l'erreur
  const { stats, isLoading } = usePaymentStatsHex();
  // Pas de source de "blocs récents" détaillée disponible via ce hook pour le moment.
  const recentBlocks: Array<{
    id: string;
    contractorName: string;
    projectTitle: string;
    amount: number;
    reason: string;
    blockedAt: string;
  }> = [];

  if (isLoading) {
    return <div className="text-center py-8">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Bloqués</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blockedPayments}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assurances Expirées</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiredInsurances}</div>
            <p className="text-xs text-muted-foreground">Entrepreneurs concernés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets en Retard</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.delayedProjects}</div>
            <p className="text-xs text-muted-foreground">Retards &gt; 20%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Manquants</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.missingDocuments}</div>
            <p className="text-xs text-muted-foreground">Paiements en attente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paiements Bloqués Récents</CardTitle>
          <CardDescription>Historique des paiements bloqués par le système de contrôle automatique</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement bloqué récemment</p>
          ) : (
            <div className="space-y-4">
              {recentBlocks.slice(0, 5).map((block) => (
                <div key={block.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Ban className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{block.contractorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {block.projectTitle} - {block.amount.toLocaleString()} MRU
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {block.reason === 'expired_insurance' ? 'Assurance expirée' :
                       block.reason === 'project_delay' ? 'Retard projet' : 'Problème conformité'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(block.blockedAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPaymentBlockingInterface;