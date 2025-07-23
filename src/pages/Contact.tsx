import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    applicant_type: '',
    individual_first_name: '',
    individual_last_name: '',
    email: '',
    phone_number: '',
    address: '',
    national_id: '',
    company_name: '',
    company_nif: '',
    request_type: 'service',
    company_address: '',
    description: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.applicant_type || !formData.email || !formData.phone_number || !formData.request_type ) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir les champs obligatoires.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const insertData: any = {
        applicant_type: formData.applicant_type,
        email: formData.email,
        national_id: formData.national_id,
        phone_number: formData.phone_number,
        request_type: formData.request_type,
        company_address :formData.company_address,
        status: 'draft'
      };

      // Add optional fields only if they have values
      if (formData.individual_first_name) insertData.individual_first_name = formData.individual_first_name;
      if (formData.individual_last_name) insertData.individual_last_name = formData.individual_last_name;
      if (formData.address) insertData.address = formData.address;
      if (formData.description) insertData.description = formData.description;
      
      if (formData.applicant_type === 'company') {
        if (formData.company_name) insertData.company_name = formData.company_name;
        if (formData.company_nif) insertData.company_nif = formData.company_nif;
      }
      
      const { data, error } = await supabase
        .from('authorization_requests')
        .insert(insertData);

      if (error) {
        console.error('Error submitting authorization request:', error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de l'envoi de votre demande.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Demande envoyée",
          description: "Votre demande d'autorisation a été envoyée avec succès.",
        });
        
        // Reset form
        setFormData({
          applicant_type: '',
          individual_first_name: '',
          individual_last_name: '',
          email: '',
          phone_number: '',
          address: '',
          national_id: '',
          company_name: '',
          company_nif: '',
          request_type: 'service',
          company_address: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  {/* Applicant Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Type de demandeur *</label>
                    <Select onValueChange={(value) => handleInputChange('applicant_type', value)} value={formData.applicant_type}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />  
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Particulier</SelectItem>
                        <SelectItem value="company">Entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Prénom *</label>
                      <Input 
                        value={formData.individual_first_name}
                        onChange={(e) => handleInputChange('individual_first_name', e.target.value)}
                        placeholder="Votre prénom" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom *</label>
                      <Input 
                        value={formData.individual_last_name}
                        onChange={(e) => handleInputChange('individual_last_name', e.target.value)}
                        placeholder="Votre nom" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <Input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="votre@email.com" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Téléphone *</label>
                      <Input 
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="Votre numéro de téléphone"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Numéro d'identité nationale *</label>
                      <Input 
                        value={formData.national_id}
                        onChange={(e) => handleInputChange('national_id', e.target.value)}
                        placeholder="Numéro d'identité"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Adresse personnelle</label>
                    <Input 
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Votre adresse personnelle"
                    />
                  </div>

                  {/* Company-specific fields */}
                  {formData.applicant_type === 'company' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Nom de l'entreprise *</label>
                          <Input 
                            value={formData.company_name}
                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                            placeholder="Nom de votre entreprise"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">NIF de l'entreprise</label>
                          <Input 
                            value={formData.company_nif}
                            onChange={(e) => handleInputChange('company_nif', e.target.value)}
                            placeholder="Numéro d'identification fiscale"
                          />
                        </div>
                      <div>
                      <label className="block text-sm font-medium mb-1">Adresse de entreprise *</label>
                      <Input 
                        value={formData.company_address}
                        onChange={(e) => handleInputChange('parcel_address', e.target.value)}
                        placeholder="Adresse entreprise demandé"
                        required
                      />
                    </div>
                      </div>
                    </>
                  )}

                  {/* Individual-specific fields */}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description du projet</label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Décrivez votre projet de station-service"
                      rows={4} 
                      className="resize-none" 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                  </Button>
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
