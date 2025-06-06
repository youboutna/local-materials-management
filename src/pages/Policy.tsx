import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Policy = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-elegant p-8">
            <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-6">
              {t("policy.title")}
            </h1>
            
            <div className="prose prose-adrar max-w-none">
              <p className="text-lg mb-6">
                {t("policy.last_update")}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section1.title")}</h2>
              <p className="mb-4">
                {t("policy.section1.text")}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section2.title")}</h2>
              <p className="mb-4">
                {t("policy.section2.text")}
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>{t("policy.section2.item1")}</li>
                <li>{t("policy.section2.item2")}</li>
                <li>{t("policy.section2.item3")}</li>
                <li>{t("policy.section2.item4")}</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section3.title")}</h2>
              <p className="mb-4">
                {t("policy.section3.text")}
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>{t("policy.section3.item1")}</li>
                <li>{t("policy.section3.item2")}</li>
                <li>{t("policy.section3.item3")}</li>
                <li>{t("policy.section3.item4")}</li>
                <li>{t("policy.section3.item5")}</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section4.title")}</h2>
              <p className="mb-4">
                {t("policy.section4.text")}
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>{t("policy.section4.item1")}</li>
                <li>{t("policy.section4.item2")}</li>
                <li>{t("policy.section4.item3")}</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section5.title")}</h2>
              <p className="mb-4">
                {t("policy.section5.text")}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section6.title")}</h2>
              <p className="mb-4">
                {t("policy.section6.text")}
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>{t("policy.section6.item1")}</li>
                <li>{t("policy.section6.item2")}</li>
                <li>{t("policy.section6.item3")}</li>
                <li>{t("policy.section6.item4")}</li>
                <li>{t("policy.section6.item5")}</li>
              </ul>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section7.title")}</h2>
              <p className="mb-4">
                {t("policy.section7.text")}
              </p>
              
              <h2 className="text-xl font-semibold mb-4">{t("policy.section8.title")}</h2>
              <p className="mb-4">
                {t("policy.section8.text")}
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
