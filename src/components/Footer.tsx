
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-adrar-800 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-2xl font-serif font-semibold">
              <span className="text-terracotta-400">Materials</span>
              <span className="text-white">Management</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Solution de gestion de projets spécialisée pour la valorisation des matériaux locaux en Mauritanie.
              Nous préservons le patrimoine culturel à travers l'innovation technologique.
            </p>
            <div className="flex space-x-3 pt-4">
              <a href="#" className="bg-adrar-700 p-2 rounded-full hover:bg-terracotta-500 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="bg-adrar-700 p-2 rounded-full hover:bg-terracotta-500 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="bg-adrar-700 p-2 rounded-full hover:bg-terracotta-500 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="bg-adrar-700 p-2 rounded-full hover:bg-terracotta-500 transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-serif font-semibold mb-4 text-ivory-300">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Projets
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link to="/materials" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Matériaux
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=login" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=register" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-lg font-serif font-semibold mb-4 text-ivory-300">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-terracotta-400 transition-colors text-sm">
                  Contactez-nous
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-lg font-serif font-semibold mb-4 text-ivory-300">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-terracotta-400 mt-0.5" />
                <span className="text-gray-300 text-sm">Nouakchott, Mauritanie</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-terracotta-400" />
                <span className="text-gray-300 text-sm">+222 xx xx xx xx</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-terracotta-400" />
                <span className="text-gray-300 text-sm">contact@materialsmanagement.mr</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Materials Management. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://hadratech.com/nous-contacter/" className="bg-adrar-700 p-2 rounded-full hover:bg-terracotta-500 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
              <div className="mt-4 md:mt-0">
                <img 
                  src="/img/payments.png"
                  alt="Payment methods"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
