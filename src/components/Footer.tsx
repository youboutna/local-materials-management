import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="mt-auto py-6 md:py-10 bg-white border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg text-adrar-800 mb-3">{t('footer.about')}</h3>
            <p className="text-adrar-600 mb-5 max-w-md">
              {t('footer.about_desc')}
            </p>
            <p className="text-adrar-500 text-sm">
              © {currentYear} - {t('footer.rights')}
            </p>
            <Link to="https://hadratech.com/" className="text-adrar-600 hover:text-adrar-900">
              {t('footer.by_hadratech')}
            </Link>
          </div>
          
          <div>
            <h3 className="font-bold text-lg text-adrar-800 mb-3">{t('footer.quick_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-adrar-600 hover:text-adrar-900">
                  {t('dashboard.title')}
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-adrar-600 hover:text-adrar-900">
                  {t('projects.title')}
                </Link>
              </li>
              <li>
                <Link to="/materials" className="text-adrar-600 hover:text-adrar-900">
                  {t('materials.title')}
                </Link>
              </li>
              <li>
                <Link to="/users" className="text-adrar-600 hover:text-adrar-900">
                  {t('nav.users')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg text-adrar-800 mb-3">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-adrar-600 hover:text-adrar-900">
                  {t('auth.terms')}
                </Link>
              </li>
              <li>
                <Link to="/policy" className="text-adrar-600 hover:text-adrar-900">
                  {t('auth.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-adrar-600 hover:text-adrar-900">
                  {t('contact.title')}
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
