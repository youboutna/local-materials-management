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
              {t('terms.title')}
            </h1>
            
            <div className="prose prose-adrar max-w-none">
              <p className="text-lg mb-6">
                {t('terms.last_update')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section1.title')}</h2>
              <p className="mb-4">
                {t('terms.section1.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section2.title')}</h2>
              <p className="mb-4">
                {t('terms.section2.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section3.title')}</h2>
              <p className="mb-4">
                {t('terms.section3.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section4.title')}</h2>
              <p className="mb-4">
                {t('terms.section4.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section5.title')}</h2>
              <p className="mb-4">
                {t('terms.section5.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section6.title')}</h2>
              <p className="mb-4">
                {t('terms.section6.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section7.title')}</h2>
              <p className="mb-4">
                {t('terms.section7.text')}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t('terms.section8.title')}</h2>
              <p className="mb-4">
                {t('terms.section8.text')}
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
