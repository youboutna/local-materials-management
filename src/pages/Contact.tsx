import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    alert(t("contact.alert.sent"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-elegant p-8">
            <h1 className="text-3xl font-serif font-bold text-adrar-900 mb-6">{t("contact.title")}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact form */}
              <div>
                <h2 className="text-xl font-semibold mb-6">{t("contact.form.title")}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">{t("contact.form.name")}</label>
                      <Input id="name" placeholder={t("contact.form.name_placeholder")} required />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">{t("contact.form.email")}</label>
                      <Input id="email" type="email" placeholder={t("contact.form.email_placeholder")} required />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">{t("contact.form.subject")}</label>
                    <Input id="subject" placeholder={t("contact.form.subject_placeholder")} required />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">{t("contact.form.message")}</label>
                    <Textarea id="message" placeholder={t("contact.form.message_placeholder")} rows={6} className="resize-none" required />
                  </div>
                  
                  <Button type="submit" className="w-full">{t("contact.form.send")}</Button>
                </form>
              </div>
              
              {/* Contact information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">{t("contact.info.title")}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-terracotta-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{t("contact.info.address")}</h3>
                      <p className="text-gray-600">{t("contact.info.address_value")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Phone className="h-6 w-6 text-terracotta-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{t("contact.info.phone")}</h3>
                      <p className="text-gray-600">{t("contact.info.phone_value")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Mail className="h-6 w-6 text-terracotta-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{t("contact.info.email")}</h3>
                      <p className="text-gray-600">{t("contact.info.email_value")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Clock className="h-6 w-6 text-terracotta-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{t("contact.info.hours")}</h3>
                      <p className="text-gray-600">{t("contact.info.hours_value")}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t">
                  <h3 className="font-medium mb-2">{t("contact.info.social")}</h3>
                  <div className="flex space-x-4">
                    <a href="#" className="h-10 w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                      <span className="sr-only">Facebook</span>
                      {/* ...icon... */}
                    </a>
                    <a href="#" className="h-10 w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                      <span className="sr-only">Twitter</span>
                      {/* ...icon... */}
                    </a>
                    <a href="#" className="h-10 w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                      <span className="sr-only">LinkedIn</span>
                      {/* ...icon... */}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Contact;
