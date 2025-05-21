
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
    'roles.admin': 'Administrateur',
    'roles.developer': 'Développeur',
    'roles.manager': 'Chef de Projet',
    'roles.director': 'Directeur',
    'projects.title': 'Projets',
    'projects.new': 'Nouveau Projet',
    'projects.search': 'Rechercher un projet...',
    'projects.status.all': 'Tous',
    'projects.status.active': 'En cours',
    'projects.status.completed': 'Terminé',
    'projects.status.pending': 'En attente',
    'projects.sort.newest': 'Plus récent',
    'projects.sort.oldest': 'Plus ancien',
    'projects.sort.name': 'Nom',
    'projects.empty': 'Aucun projet trouvé',
    'materials.title': 'Matériaux',
    'materials.new': 'Nouveau Matériau',
    'materials.name': 'Nom',
    'materials.category': 'Catégorie',
    'materials.price': 'Prix unitaire',
    'materials.quantity': 'Quantité',
    'materials.unit': 'Unité',
    'materials.description': 'Description',
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
    'roles.developer': 'مطور',
    'roles.manager': 'مدير مشروع',
    'roles.director': 'مدير',
    'projects.title': 'المشاريع',
    'projects.new': 'مشروع جديد',
    'projects.search': 'البحث عن مشروع...',
    'projects.status.all': 'الكل',
    'projects.status.active': 'قيد التنفيذ',
    'projects.status.completed': 'مكتمل',
    'projects.status.pending': 'قيد الانتظار',
    'projects.sort.newest': 'الأحدث',
    'projects.sort.oldest': 'الأقدم',
    'projects.sort.name': 'الاسم',
    'projects.empty': 'لم يتم العثور على مشاريع',
    'materials.title': 'المواد',
    'materials.new': 'مادة جديدة',
    'materials.name': 'الاسم',
    'materials.category': 'الفئة',
    'materials.price': 'سعر الوحدة',
    'materials.quantity': 'الكمية',
    'materials.unit': 'الوحدة',
    'materials.description': 'الوصف',
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
    'roles.developer': 'Developer',
    'roles.manager': 'Project Manager',
    'roles.director': 'Director',
    'projects.title': 'Projects',
    'projects.new': 'New Project',
    'projects.search': 'Search for a project...',
    'projects.status.all': 'All',
    'projects.status.active': 'In Progress',
    'projects.status.completed': 'Completed',
    'projects.status.pending': 'Pending',
    'projects.sort.newest': 'Newest',
    'projects.sort.oldest': 'Oldest',
    'projects.sort.name': 'Name',
    'projects.empty': 'No projects found',
    'materials.title': 'Materials',
    'materials.new': 'New Material',
    'materials.name': 'Name',
    'materials.category': 'Category',
    'materials.price': 'Unit Price',
    'materials.quantity': 'Quantity',
    'materials.unit': 'Unit',
    'materials.description': 'Description',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  // Load saved language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['fr', 'ar', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
      
      // Set text direction based on language
      document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
      
      // Add language class to body for additional styling if needed
      document.body.className = `lang-${savedLanguage}`;
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
    
    // Set text direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Update language class on body
    document.body.className = `lang-${language}`;
  }, [language]);

  // Translation function
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
