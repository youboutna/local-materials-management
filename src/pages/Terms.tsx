
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Terms = () => {
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
            <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-6">Conditions d'utilisation</h1>
            
            <div className="prose max-w-none text-adrar-700">
              <p className="lead">
                Bienvenue sur notre plateforme de gestion de projets. Veuillez lire attentivement ces conditions d'utilisation avant d'utiliser notre service.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptation des conditions</h2>
              <p>
                En accédant à cette plateforme, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et règlements applicables, et vous acceptez que vous êtes responsable du respect des lois locales applicables. Si vous n'acceptez pas ces conditions, vous êtes interdit d'utiliser ou d'accéder à ce site.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">2. Utilisation de la licence</h2>
              <p>
                L'autorisation est accordée d'utiliser temporairement une copie du service pour un usage personnel et non commercial. Cette licence ne constitue pas un transfert de titre et ne vous permet pas de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modifier ou copier les matériaux</li>
                <li>Utiliser les matériaux à des fins commerciales ou pour toute démonstration publique</li>
                <li>Tenter de décompiler ou désassembler tout logiciel contenu sur le service</li>
                <li>Supprimer tout droit d'auteur ou autres notations de propriété des matériaux</li>
                <li>Transférer les matériaux à une autre personne ou "mettre en miroir" les matériaux sur tout autre serveur</li>
              </ul>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">3. Exactitude des matériaux</h2>
              <p>
                Les matériaux apparaissant sur notre service pourraient inclure des erreurs techniques, typographiques ou photographiques. Nous ne garantissons pas que tout matériel sur notre service est exact, complet ou à jour. Nous pouvons apporter des changements aux matériaux contenus sur notre service à tout moment sans préavis.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">4. Limitations</h2>
              <p>
                En aucun cas, nous ou nos fournisseurs ne serons tenus responsables de tout dommage (y compris, sans limitation, des dommages pour perte de données ou de profit, ou en raison d'interruption d'activité) découlant de l'utilisation ou de l'incapacité d'utiliser les matériaux sur notre service, même si nous avons été informés de la possibilité de tels dommages.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">5. Modifications des conditions d'utilisation</h2>
              <p>
                Nous pouvons réviser ces conditions d'utilisation pour notre service à tout moment sans préavis. En utilisant ce site, vous acceptez d'être lié par la version actuelle de ces conditions d'utilisation.
              </p>
              
              <h2 className="text-xl font-semibold mt-8 mb-4">6. Loi applicable</h2>
              <p>
                Ces conditions sont régies et interprétées conformément aux lois nationales, et vous vous soumettez irrévocablement à la juridiction exclusive des tribunaux de cet État ou lieu.
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

export default Terms;
