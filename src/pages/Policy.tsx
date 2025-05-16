
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Policy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-elegant p-8">
            <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-6">Politique de Confidentialité</h1>
            
            <div className="prose prose-adrar max-w-none">
              <p className="text-lg mb-6">
                Dernière mise à jour : 16 mai 2025
              </p>
              
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Nous nous engageons à protéger la vie privée et les données personnelles de nos utilisateurs. Cette politique de confidentialité explique comment nous recueillons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre plateforme de gestion de matériaux et de projets.
              </p>
              
              <h2 className="text-xl font-semibold mb-4">2. Informations que nous recueillons</h2>
              <p className="mb-4">
                Nous recueillons les types d'informations suivants :
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Informations personnelles : nom, adresse e-mail, numéro de téléphone, identifiant national.</li>
                <li>Informations de compte : identifiants de connexion, préférences et paramètres.</li>
                <li>Données de projet : détails des projets, matériaux, inspections et paiements.</li>
                <li>Informations d'utilisation : comment vous interagissez avec notre plateforme, les fonctionnalités utilisées et le temps passé.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">3. Comment nous utilisons vos informations</h2>
              <p className="mb-4">
                Nous utilisons vos informations pour :
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Fournir et maintenir nos services.</li>
                <li>Améliorer, personnaliser et développer notre plateforme.</li>
                <li>Communiquer avec vous, y compris vous envoyer des mises à jour sur nos services.</li>
                <li>Assurer la sécurité de notre plateforme.</li>
                <li>Se conformer aux obligations légales.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">4. Partage des informations</h2>
              <p className="mb-4">
                Nous ne partageons vos informations personnelles qu'avec :
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Les membres de votre équipe ou organisation ayant accès au même projet.</li>
                <li>Nos fournisseurs de services tiers qui nous aident à exploiter notre plateforme.</li>
                <li>Les autorités légales lorsque nous sommes légalement tenus de le faire.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">5. Sécurité des données</h2>
              <p className="mb-4">
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre l'accès non autorisé, l'altération, la divulgation ou la destruction.
              </p>
              
              <h2 className="text-xl font-semibold mb-4">6. Vos droits</h2>
              <p className="mb-4">
                Vous avez le droit de :
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Accéder à vos données personnelles.</li>
                <li>Rectifier vos données personnelles si elles sont inexactes.</li>
                <li>Demander l'effacement de vos données personnelles.</li>
                <li>Restreindre ou vous opposer au traitement de vos données.</li>
                <li>Demander la portabilité de vos données.</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">7. Modifications de cette politique</h2>
              <p className="mb-4">
                Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialité sur cette page.
              </p>
              
              <h2 className="text-xl font-semibold mb-4">8. Contact</h2>
              <p className="mb-4">
                Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à privacy@materiaux-gestion.mr.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Policy;
