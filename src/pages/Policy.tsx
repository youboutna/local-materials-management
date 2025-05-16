
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Policy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>

          <div className="bg-white rounded-xl shadow-elegant p-8">
            <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-6">Politique de confidentialité</h1>
            
            <div className="prose max-w-none text-adrar-700">
              <p className="lead">
                La protection de vos données privées est notre priorité. Cette politique de confidentialité explique comment nous collectons, utilisons, et protégeons vos informations personnelles.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Collecte des informations</h2>
              <p>
                Nous recueillons les informations que vous nous fournissez lors de la création de votre compte, de l'utilisation de notre service, ou lorsque vous nous contactez. Ces informations peuvent inclure:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vos données d'identification (nom, prénom, email)</li>
                <li>Vos coordonnées professionnelles</li>
                <li>Les informations de paiement et de facturation</li>
                <li>Les données d'utilisation de notre plateforme</li>
                <li>Les communications que vous avez avec notre équipe</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Utilisation des données</h2>
              <p>
                Nous utilisons les informations collectées pour:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fournir, maintenir et améliorer nos services</li>
                <li>Traiter les transactions et envoyer les factures</li>
                <li>Communiquer avec vous concernant votre compte ou nos services</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Analyser l'utilisation de notre plateforme pour l'améliorer</li>
                <li>Protéger contre les activités frauduleuses ou abusives</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Protection des données</h2>
              <p>
                La sécurité de vos données personnelles est importante pour nous. Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès, modification, divulgation ou destruction non autorisés.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Partage des informations</h2>
              <p>
                Nous ne vendons, n'échangeons, ni ne transférons vos informations personnelles à des tiers sans votre consentement, sauf:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pour fournir les services que vous avez demandés</li>
                <li>Avec nos prestataires de services sous contrat</li>
                <li>Lorsque nécessaire pour se conformer à la loi</li>
                <li>Pour protéger nos droits, notre propriété ou notre sécurité</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Vos droits</h2>
              <p>
                Conformément aux réglementations applicables, vous disposez de plusieurs droits concernant vos données:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Droit d'accès à vos données personnelles</li>
                <li>Droit de rectification de vos données</li>
                <li>Droit à l'effacement de vos données</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité des données</li>
                <li>Droit d'opposition au traitement</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Cookies et technologies similaires</h2>
              <p>
                Nous utilisons des cookies et technologies similaires pour améliorer votre expérience sur notre site, analyser notre trafic et personnaliser le contenu. Vous pouvez contrôler l'utilisation des cookies via les paramètres de votre navigateur.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">7. Modifications de cette politique</h2>
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement significatif par email ou par une notification sur notre plateforme.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">8. Nous contacter</h2>
              <p>
                Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter à:
              </p>
              <p>
                <strong>Email:</strong> privacy@example.com<br />
                <strong>Adresse:</strong> 123 Rue de l'Abri, Nouakchott, Mauritanie
              </p>
              
              <div className="mt-12 text-center text-adrar-500 text-sm">
                Dernière mise à jour: 16 Mai 2025
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policy;
