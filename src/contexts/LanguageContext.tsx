import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  fr: {
    // UI Labels
    'app.name': 'Gestion de Projets',
    'app.description': 'Système de gestion des projets et matériaux',
    'nav.home': 'Accueil',
    'nav.projects': 'Projets',
    'nav.materials': 'Matériaux',
    'nav.users': 'Utilisateurs',
    'nav.login': 'Connexion',
    'nav.profile': 'Profil',
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom complet',
    'auth.submit': 'Soumettre',
    // Roles
    'roles.admin': 'Administrateur',
    'roles.manager': 'Chef de Projet',
    'roles.director': 'Directeur',
    'roles.agent': 'Agent',
    'roles.supplier': 'Fournisseur',
    'roles.user': 'Utilisateur',
    // Project Status ENUM
    'project_status.in_progress': 'En cours',
    'project_status.completed': 'Terminé',
    'project_status.pending': 'En attente',
    'project_status.cancelled': 'Annulé',
    // Document Status ENUM
    'document_status.draft': 'Brouillon',
    'document_status.pending_review': 'En attente de révision',
    'document_status.approved': 'Approuvé',
    'document_status.rejected': 'Rejeté',
    'document_status.archived': 'Archivé',
    // Inputs & Descriptions
    'projects.title': 'Projets',
    'projects.new': 'Nouveau Projet',
    'projects.search': 'Rechercher un projet...',
    'projects.status.all': 'Tous',
    'projects.empty': 'Aucun projet trouvé',
    'materials.title': 'Matériaux',
    'materials.new': 'Nouveau Matériau',
    'materials.name': 'Nom',
    'materials.category': 'Catégorie',
    'materials.price': 'Prix unitaire',
    'materials.quantity': 'Quantité',
    'materials.unit': 'Unité',
    'materials.description': 'Description',
    // Tender Inputs & Alerts
    'tender.input.title': 'Titre du document',
    'tender.input.description': 'Description',
    'tender.input.category': 'Catégorie',
    'tender.input.subcategory': 'Sous-catégorie',
    'tender.button.add': 'Ajouter',
    'tender.button.loading': 'Ajout en cours...',
    'tender.alert.upload_error': "Erreur lors de l'upload du fichier",
    'tender.alert.document_error': "Erreur lors de l'ajout du document",
    'tender.alert.tenderdoc_error': "Erreur lors de la création du TenderDocument",
    'tender.alert.success': "Document ajouté !",
    'tender_category.administrative': 'Administratif',
    'tender_category.technical': 'Technique',
    'tender_category.financial': 'Financier',
    'tender_subcategory.lettre_soumission': 'Lettre de soumission',
    'tender_subcategory.pouvoir_signature': 'Pouvoir de signature',
    'ts.empty': 'Aucune donnée à afficher',
    // ...add more as needed
  },
  ar: {
    'app.name': 'إدارة المشاريع',
    'app.description': 'نظام إدارة المشاريع والمواد',
    'nav.home': 'الرئيسية',
    'nav.projects': 'المشاريع',
    'nav.materials': 'المواد',
    'nav.users': 'المستخدمون',
    'nav.login': 'تسجيل الدخول',
    'nav.profile': 'الملف الشخصي',
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'التسجيل',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.submit': 'إرسال',
    'roles.admin': 'مسؤول',
    'roles.manager': 'مدير مشروع',
    'roles.director': 'مدير',
    'roles.agent': 'وكيل',
    'roles.supplier': 'مورد',
    'roles.user': 'مستخدم',
    'project_status.in_progress': 'قيد التنفيذ',
    'project_status.completed': 'مكتمل',
    'project_status.pending': 'قيد الانتظار',
    'project_status.cancelled': 'ملغى',
    'document_status.draft': 'مسودة',
    'document_status.pending_review': 'قيد المراجعة',
    'document_status.approved': 'موافق عليه',
    'document_status.rejected': 'مرفوض',
    'document_status.archived': 'مؤرشف',
    'projects.title': 'المشاريع',
    'projects.new': 'مشروع جديد',
    'projects.search': 'البحث عن مشروع...',
    'projects.status.all': 'الكل',
    'projects.empty': 'لم يتم العثور على مشاريع',
    'materials.title': 'المواد',
    'materials.new': 'مادة جديدة',
    'materials.name': 'الاسم',
    'materials.category': 'الفئة',
    'materials.price': 'سعر الوحدة',
    'materials.quantity': 'الكمية',
    'materials.unit': 'الوحدة',
    'materials.description': 'الوصف',
    // Tender Inputs & Alerts
    'tender.input.title': 'عنوان المستند',
    'tender.input.description': 'الوصف',
    'tender.input.category': 'الفئة',
    'tender.input.subcategory': 'الفئة الفرعية',
    'tender.button.add': 'إضافة',
    'tender.button.loading': 'جاري الإضافة...',
    'tender.alert.upload_error': 'خطأ أثناء رفع الملف',
    'tender.alert.document_error': 'خطأ أثناء إضافة المستند',
    'tender.alert.tenderdoc_error': 'خطأ أثناء إنشاء مستند المناقصة',
    'tender.alert.success': 'تمت إضافة المستند!',
    'tender_category.administrative': 'إداري',
    'tender_category.technical': 'تقني',
    'tender_category.financial': 'مالي',
    'tender_subcategory.lettre_soumission': 'خطاب التقديم',
    'tender_subcategory.pouvoir_signature': 'تفويض التوقيع',
    'ts.empty': 'لا توجد بيانات للعرض',
    // ...add more as needed
  },
  en: {
    'app.name': 'Project Management',
    'app.description': 'Project and Material Management System',
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.materials': 'Materials',
    'nav.users': 'Users',
    'nav.login': 'Login',
    'nav.profile': 'Profile',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.submit': 'Submit',
    'roles.admin': 'Administrator',
    'roles.manager': 'Manager',
    'roles.director': 'Director',
    'roles.agent': 'Agent',
    'roles.supplier': 'Supplier',
    'roles.user': 'User',
    'project_status.in_progress': 'In Progress',
    'project_status.completed': 'Completed',
    'project_status.pending': 'Pending',
    'project_status.cancelled': 'Cancelled',
    'document_status.draft': 'Draft',
    'document_status.pending_review': 'Pending Review',
    'document_status.approved': 'Approved',
    'document_status.rejected': 'Rejected',
    'document_status.archived': 'Archived',
    'projects.title': 'Projects',
    'projects.new': 'New Project',
    'projects.search': 'Search for a project...',
    'projects.status.all': 'All',
    'projects.empty': 'No projects found',
    'materials.title': 'Materials',
    'materials.new': 'New Material',
    'materials.name': 'Name',
    'materials.category': 'Category',
    'materials.price': 'Unit Price',
    'materials.quantity': 'Quantity',
    'materials.unit': 'Unit',
    'materials.description': 'Description',
    // Tender Inputs & Alerts
    'tender.input.title': 'Document Title',
    'tender.input.description': 'Description',
    'tender.input.category': 'Category',
    'tender.input.subcategory': 'Subcategory',
    'tender.button.add': 'Add',
    'tender.button.loading': 'Adding...',
    'tender.alert.upload_error': 'Error uploading file',
    'tender.alert.document_error': 'Error adding document',
    'tender.alert.tenderdoc_error': 'Error creating TenderDocument',
    'tender.alert.success': 'Document added!',
    'tender_category.administrative': 'Administrative',
    'tender_category.technical': 'Technical',
    'tender_category.financial': 'Financial',
    'tender_subcategory.lettre_soumission': 'Submission Letter',
    'tender_subcategory.pouvoir_signature': 'Signature Authority',
    'ts.empty': 'No data to display',
    // ...add more as needed
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['fr', 'ar', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
      document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
      document.body.className = `lang-${savedLanguage}`;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.className = `lang-${language}`;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
