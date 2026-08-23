import { useLanguage } from '@/contexts/LanguageContext';

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

const OAuthErrorHandler = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (!error) return null;

  const getErrorMessage = (error: string, description?: string | null) => {
    switch (error) {
      case 'access_denied':
        return t('auto.oautherrorhandler.acces_refuse_vous_avez_annule_la_connexion');
      case 'unauthorized_client':
        return t('auto.oautherrorhandler.configuration_oauth_incorrecte_verifiez_les_para');
      case 'invalid_request':
        return t('auto.oautherrorhandler.requete_invalide_probleme_de_configuration_oauth');
      default:
        return description || t('auto.oautherrorhandler.erreur_de_connexion_oauth_verifiez_votre_configu');
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {getErrorMessage(error, errorDescription)}
      </AlertDescription>
    </Alert>
  );
};

export default OAuthErrorHandler;
