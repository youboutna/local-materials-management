/**
 * Page publique d'inscription fournisseur (/fournisseur/register).
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SupplierRegistrationForm from '@/components/auth/SupplierRegistrationForm';
import { ROUTES } from '@/config/routes';

const SupplierRegister = () => (
  <div className="mx-auto w-full max-w-3xl px-4 py-10">
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Inscription fournisseur</CardTitle>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de votre entreprise. Votre demande sera validée par
          l’administration avant l’accès au portail fournisseur.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <SupplierRegistrationForm />
        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link to={ROUTES.auth} className="text-primary underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  </div>
);

export default SupplierRegister;
