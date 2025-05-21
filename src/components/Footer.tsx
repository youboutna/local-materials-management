
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-6 md:py-10 bg-white border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg text-adrar-800 mb-3">À propos</h3>
            <p className="text-adrar-600 mb-5 max-w-md">
              Notre plateforme de gestion de projets facilite le suivi et la gestion efficace de projets
              de construction et d'infrastructure dans toute la Mauritanie.
            </p>
            <p className="text-adrar-500 text-sm">
              © {currentYear} - Tous droits réservés
            </p>
              <Link to="https://hadratech.com/" className="text-adrar-600 hover:text-adrar-900">
                  by hadrtach
                </Link>
          </div>
          
          <div>
            <h3 className="font-bold text-lg text-adrar-800 mb-3">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-adrar-600 hover:text-adrar-900">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-adrar-600 hover:text-adrar-900">
                  Projets
                </Link>
              </li>
              <li>
                <Link to="/materials" className="text-adrar-600 hover:text-adrar-900">
                  Matériaux
                </Link>
              </li>
              <li>
                <Link to="/users" className="text-adrar-600 hover:text-adrar-900">
                  Utilisateurs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg text-adrar-800 mb-3">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-adrar-600 hover:text-adrar-900">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/policy" className="text-adrar-600 hover:text-adrar-900">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-adrar-600 hover:text-adrar-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
