
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define available languages
export type Language = 'fr' | 'ar' | 'en';

// Define language context type
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define translations
type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

// All translations for the application
const translations: Translations = {
  fr: {
    // General
    'app.name': 'Matériaux Durables',
    'app.description': 'Gestion des ressources locales et projets durables',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.projects': 'Projets',
    'nav.materials': 'Matériaux',
    'nav.users': 'Utilisateurs',
    'nav.dashboard': 'Tableau de bord',
    'nav.login': 'Se connecter',
    'nav.logout': 'Déconnexion',
    
    // Materials page
    'materials.title': 'Matériaux Locaux',
    'materials.subtitle': 'Gestion des ressources et sources de matériaux de construction locaux',
    'materials.search': 'Rechercher un matériau ou une source...',
    'materials.add': 'Nouvelle source',
    'materials.types': 'Types de matériaux locaux',
    
    // Project page
    'projects.title': 'Projets',
    'projects.subtitle': 'Gestion des projets de construction durables',
    'projects.search': 'Rechercher un projet...',
    'projects.add': 'Nouveau projet',
    'projects.all': 'Tous les projets',
    
    // Status
    'status.inProgress': 'En cours',
    'status.completed': 'Terminé',
    'status.pending': 'En attente',
    'status.suspended': 'Suspendu',
    'status.cancelled': 'Annulé',
    
    // Roles
    'role.admin': 'Administrateur',
    'role.dev': 'Développeur',
    'role.projectManager': 'Chef de projet',
    'role.director': 'Directeur d\'établissement',
  },
  ar: {
    // General
    'app.name': 'المواد المستدامة',
    'app.description': 'إدارة الموارد المحلية والمشاريع المستدامة',
    
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.projects': 'المشاريع',
    'nav.materials': 'المواد',
    'nav.users': 'المستخدمين',
    'nav.dashboard': 'لوحة التحكم',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    
    // Materials page
    'materials.title': 'المواد المحلية',
    'materials.subtitle': 'إدارة الموارد ومصادر مواد البناء المحلية',
    'materials.search': 'ابحث عن مادة أو مصدر...',
    'materials.add': 'مصدر جديد',
    'materials.types': 'أنواع المواد المحلية',
    
    // Project page
    'projects.title': 'المشاريع',
    'projects.subtitle': 'إدارة مشاريع البناء المستدامة',
    'projects.search': 'ابحث عن مشروع...',
    'projects.add': 'مشروع جديد',
    'projects.all': 'كل المشاريع',
    
    // Status
    'status.inProgress': 'قيد التنفيذ',
    'status.completed': 'مكتمل',
    'status.pending': 'قيد الانتظار',
    'status.suspended': 'معلق',
    'status.cancelled': 'ملغى',
    
    // Roles
    'role.admin': 'مسؤول',
    'role.dev': 'مطور',
    'role.projectManager': 'مدير المشروع',
    'role.director': 'مدير المؤسسة',
  },
  en: {
    // General
    'app.name': 'Sustainable Materials',
    'app.description': 'Management of local resources and sustainable projects',
    
    // Navigation
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.materials': 'Materials',
    'nav.users': 'Users',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    
    // Materials page
    'materials.title': 'Local Materials',
    'materials.subtitle': 'Management of resources and local construction materials sources',
    'materials.search': 'Search for a material or source...',
    'materials.add': 'New source',
    'materials.types': 'Types of local materials',
    
    // Project page
    'projects.title': 'Projects',
    'projects.subtitle': 'Management of sustainable construction projects',
    'projects.search': 'Search for a project...',
    'projects.add': 'New project',
    'projects.all': 'All projects',
    
    // Status
    'status.inProgress': 'In Progress',
    'status.completed': 'Completed',
    'status.pending': 'Pending',
    'status.suspended': 'Suspended',
    'status.cancelled': 'Cancelled',
    
    // Roles
    'role.admin': 'Administrator',
    'role.dev': 'Developer',
    'role.projectManager': 'Project Manager',
    'role.director': 'Establishment Director',
  }
};

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get saved language from localStorage or default to French
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'fr';
  });

  // Update language in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
    // For RTL language support (Arabic)
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Function to set language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
