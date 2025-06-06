import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Terms = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-elegant p-8">
            <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-6">
              {t('terms.title') || "Conditions Générales d'Utilisation"}
            </h1>
            
            <div className="prose prose-adrar max-w-none">
              <p className="text-lg mb-6">
                {t('terms.last_update') || "Dernière mise à jour : 16 mai 2025"}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section1.title') || "1. Acceptation des conditions"}</h2>
              <p className="mb-4">
                {t('terms.section1.text') || "En accédant et en utilisant cette plateforme de gestion de matériaux et de projets, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser cette plateforme."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section2.title') || "2. Description du service"}</h2>
              <p className="mb-4">
                {t('terms.section2.text') || "Notre plateforme offre des outils de gestion de projets et de matériaux pour les secteurs de la construction et des travaux publics. Les fonctionnalités comprennent le suivi des projets, la gestion des matériaux, les inspections, et le suivi financier."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section3.title') || "3. Comptes utilisateurs"}</h2>
              <p className="mb-4">
                {t('terms.section3.text') || "Pour accéder à certaines fonctionnalités de la plateforme, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos informations de compte et de toutes les activités qui se produisent sous votre compte."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section4.title') || "4. Utilisation appropriée"}</h2>
              <p className="mb-4">
                {t('terms.section4.text') || "Vous acceptez d'utiliser la plateforme uniquement à des fins légales et d'une manière qui ne viole pas les droits d'autrui ou ne restreint pas leur utilisation de la plateforme."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section5.title') || "5. Propriété intellectuelle"}</h2>
              <p className="mb-4">
                {t('terms.section5.text') || "Tout le contenu présent sur la plateforme, y compris les textes, graphiques, logos, icônes et images, est la propriété de notre entreprise et est protégé par les lois sur la propriété intellectuelle."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section6.title') || "6. Limitation de responsabilité"}</h2>
              <p className="mb-4">
                {t('terms.section6.text') || "Notre entreprise ne sera pas responsable des dommages directs, indirects, accessoires, consécutifs ou punitifs résultant de votre accès ou utilisation de la plateforme."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section7.title') || "7. Modifications des conditions"}</h2>
              <p className="mb-4">
                {t('terms.section7.text') || "Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur dès leur publication sur la plateforme. Votre utilisation continue de la plateforme après la publication des modifications constitue votre acceptation de ces modifications."}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section8.title') || "8. Contact"}</h2>
              <p className="mb-4">
                {t('terms.section8.text') || "Si vous avez des questions concernant ces conditions, veuillez nous contacter à l'adresse électronique support@materiaux-gestion.mr ou par téléphone au +222 45 25 25 25."}
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
