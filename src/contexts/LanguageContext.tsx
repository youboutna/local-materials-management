
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  fr: {
    // App info
    'app.name': 'ADRAR Construct',
    'app.description': 'Système de gestion de construction',

    // Navigation
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de bord',
    'nav.projects': 'Projets',
    'nav.materials': 'Matériaux',
    'nav.documents': 'Documents',
    'nav.users': 'Utilisateurs',
    'nav.profile': 'Profil',
    'nav.login': 'Connexion',
    'nav.logout': 'Déconnexion',
    'nav.settings': 'Paramètres',
    'nav.back': 'Retour',
    'nav.next': 'Suivant',
    'nav.previous': 'Précédent',
    'nav.forward': 'Suivant',
    'nav.close': 'Fermer',
    'nav.open': 'Ouvrir',
    'nav.tender_management': 'Appels d\'Offres',

    // Dashboard translations
    'dashboard.title': 'Tableau de Bord',
    'dashboard.welcome': 'Bienvenue sur le tableau de bord',
    'dashboard.overview': 'Vue d\'ensemble',
    'dashboard.statistics': 'Statistiques',
    'dashboard.recent_projects': 'Projets récents',
    'dashboard.quick_actions': 'Actions rapides',

    // Projects
    'projects.title': 'Projets',
    'projects.all': 'Tous les projets',
    'projects.all_desc': 'Gérer et visualiser tous les projets',
    'projects.new': 'Nouveau projet',
    'projects.new_desc': 'Créer un nouveau projet',
    'projects.create': 'Créer un projet',
    'projects.edit': 'Modifier le projet',
    'projects.delete': 'Supprimer le projet',
    'projects.details': 'Détails du projet',
    'projects.status': 'Statut',
    'projects.progress': 'Progression',
    'projects.budget': 'Budget',
    'projects.location': 'Localisation',
    'projects.start_date': 'Date de début',
    'projects.end_date': 'Date de fin',
    'projects.description': 'Description',
    'projects.team_size': 'Taille de l\'équipe',

    // Materials
    'materials.title': 'Matériaux',
    'materials.all': 'Tous les matériaux',
    'materials.create': 'Créer un matériau',
    'materials.edit': 'Modifier le matériau',
    'materials.delete': 'Supprimer le matériau',
    'materials.name': 'Nom',
    'materials.category': 'Catégorie',
    'materials.price': 'Prix',
    'materials.quantity': 'Quantité',
    'materials.unit': 'Unité',
    'materials.available': 'Disponible',

    // Documents
    'documents.title': 'Documents',
    'documents.upload': 'Télécharger',
    'documents.download': 'Télécharger',
    'documents.delete': 'Supprimer',
    'documents.view': 'Voir',
    'documents.edit': 'Modifier',

    // Task management
    'task.title': 'Tâches',
    'task.create': 'Créer une tâche',
    'task.edit': 'Modifier la tâche',
    'task.delete': 'Supprimer la tâche',
    'task.assign': 'Assigner',
    'task.status': 'Statut',
    'task.priority': 'Priorité',
    'task.due_date': 'Date d\'échéance',

    // Authentication
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirm_password': 'Confirmer le mot de passe',
    'auth.forgot_password': 'Mot de passe oublié',
    'auth.reset_password': 'Réinitialiser le mot de passe',
    'auth.terms': 'Conditions d\'utilisation',
    'auth.privacy': 'Politique de confidentialité',

    // Settings
    'settings.title': 'Paramètres',
    'settings.profile': 'Profil',
    'settings.account': 'Compte',
    'settings.preferences': 'Préférences',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.notifications': 'Notifications',

    // Language names
    'language.french': 'Français',
    'language.arabic': 'العربية',
    'language.english': 'English',

    // Common actions
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.update': 'Mettre à jour',
    'common.submit': 'Soumettre',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.warning': 'Avertissement',
    'common.info': 'Information',
    'common.confirm': 'Confirmer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.print': 'Imprimer',
    'common.share': 'Partager',
    'common.copy': 'Copier',
    'common.paste': 'Coller',
    'common.cut': 'Couper',
    'common.undo': 'Annuler',
    'common.redo': 'Rétablir',
    'common.select_all': 'Tout sélectionner',
    'common.clear': 'Effacer',
    'common.refresh': 'Actualiser',
    'common.help': 'Aide',
    'common.about': 'À propos',
    'common.version': 'Version',
    'common.contact': 'Contact',
    'common.support': 'Support',

    // Project import
    'project_import.title': 'Import projets',
    'project_import.desc': 'Importer les projets 2025',

    // Index page
    'index.loading': 'Chargement...',
    'index.feature.projects.title': 'Projets',
    'index.feature.projects.description': 'Gérez vos projets de construction',
    'index.feature.materials.title': 'Matériaux',
    'index.feature.materials.description': 'Gestion des matériaux',
    'index.feature.documents.title': 'Documents',
    'index.feature.documents.description': 'Gestion documentaire',
    'index.feature.teams.title': 'Équipes',
    'index.feature.teams.description': 'Gestion des équipes',
    'index.feature.dashboard.title': 'Tableau de bord',
    'index.feature.dashboard.description': 'Vue d\'ensemble',
    'index.features.title': 'Fonctionnalités',
    'index.features.description': 'Découvrez nos outils de gestion',
    'index.features.discover': 'Découvrir',
    'index.features.login_to_access': 'Se connecter pour accéder',
    'index.cta.title': 'Commencez dès maintenant',
    'index.cta.authenticated': 'Accédez à votre tableau de bord',
    'index.cta.unauthenticated': 'Créez votre compte pour commencer',
    'index.cta.dashboard': 'Tableau de bord',
    'index.cta.my_projects': 'Mes projets',
    'index.cta.start_free': 'Commencer gratuitement',
    'index.cta.login': 'Se connecter',

    // Footer
    'footer.about': 'À propos',
    'footer.about_desc': 'Système de gestion de construction pour l\'efficacité des projets',
    'footer.rights': 'Tous droits réservés',
    'footer.by_hadratech': 'Développé par HadraTech',
    'footer.quick_links': 'Liens rapides',
    'footer.legal': 'Légal',

    // Contact
    'contact.title': 'Contact',
  },
  
  ar: {
    // App info
    'app.name': 'أدرار للبناء',
    'app.description': 'نظام إدارة البناء',

    // Navigation
    'nav.home': 'الرئيسية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.projects': 'المشاريع',
    'nav.materials': 'المواد',
    'nav.documents': 'الوثائق',
    'nav.users': 'المستخدمون',
    'nav.profile': 'الملف الشخصي',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    'nav.settings': 'الإعدادات',
    'nav.back': 'العودة',
    'nav.next': 'التالي',
    'nav.previous': 'السابق',
    'nav.forward': 'التالي',
    'nav.close': 'إغلاق',
    'nav.open': 'فتح',
    'nav.tender_management': 'المناقصات',

    // Dashboard translations
    'dashboard.title': 'لوحة القيادة',
    'dashboard.welcome': 'مرحباً بك في لوحة التحكم',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.statistics': 'الإحصائيات',
    'dashboard.recent_projects': 'المشاريع الأخيرة',
    'dashboard.quick_actions': 'الإجراءات السريعة',

    // Projects
    'projects.title': 'المشاريع',
    'projects.all': 'جميع المشاريع',
    'projects.all_desc': 'إدارة وعرض جميع المشاريع',
    'projects.new': 'مشروع جديد',
    'projects.new_desc': 'إنشاء مشروع جديد',
    'projects.create': 'إنشاء مشروع',
    'projects.edit': 'تعديل المشروع',
    'projects.delete': 'حذف المشروع',
    'projects.details': 'تفاصيل المشروع',
    'projects.status': 'الحالة',
    'projects.progress': 'التقدم',
    'projects.budget': 'الميزانية',
    'projects.location': 'الموقع',
    'projects.start_date': 'تاريخ البداية',
    'projects.end_date': 'تاريخ الانتهاء',
    'projects.description': 'الوصف',
    'projects.team_size': 'حجم الفريق',

    // Materials
    'materials.title': 'المواد',
    'materials.all': 'جميع المواد',
    'materials.create': 'إنشاء مادة',
    'materials.edit': 'تعديل المادة',
    'materials.delete': 'حذف المادة',
    'materials.name': 'الاسم',
    'materials.category': 'الفئة',
    'materials.price': 'السعر',
    'materials.quantity': 'الكمية',
    'materials.unit': 'الوحدة',
    'materials.available': 'متوفر',

    // Documents
    'documents.title': 'الوثائق',
    'documents.upload': 'رفع',
    'documents.download': 'تنزيل',
    'documents.delete': 'حذف',
    'documents.view': 'عرض',
    'documents.edit': 'تعديل',

    // Task management
    'task.title': 'المهام',
    'task.create': 'إنشاء مهمة',
    'task.edit': 'تعديل المهمة',
    'task.delete': 'حذف المهمة',
    'task.assign': 'تعيين',
    'task.status': 'الحالة',
    'task.priority': 'الأولوية',
    'task.due_date': 'تاريخ الاستحقاق',

    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'التسجيل',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirm_password': 'تأكيد كلمة المرور',
    'auth.forgot_password': 'نسيت كلمة المرور',
    'auth.reset_password': 'إعادة تعيين كلمة المرور',
    'auth.terms': 'شروط الاستخدام',
    'auth.privacy': 'سياسة الخصوصية',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.profile': 'الملف الشخصي',
    'settings.account': 'الحساب',
    'settings.preferences': 'التفضيلات',
    'settings.language': 'اللغة',
    'settings.theme': 'السمة',
    'settings.notifications': 'الإشعارات',

    // Language names
    'language.french': 'Français',
    'language.arabic': 'العربية',
    'language.english': 'English',

    // Common actions
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.update': 'تحديث',
    'common.submit': 'إرسال',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',
    'common.confirm': 'تأكيد',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.print': 'طباعة',
    'common.share': 'مشاركة',
    'common.copy': 'نسخ',
    'common.paste': 'لصق',
    'common.cut': 'قص',
    'common.undo': 'تراجع',
    'common.redo': 'إعادة',
    'common.select_all': 'تحديد الكل',
    'common.clear': 'مسح',
    'common.refresh': 'تحديث',
    'common.help': 'مساعدة',
    'common.about': 'حول',
    'common.version': 'الإصدار',
    'common.contact': 'اتصال',
    'common.support': 'الدعم',

    // Project import
    'project_import.title': 'استيراد المشاريع',
    'project_import.desc': 'استيراد مشاريع 2025',

    // Index page
    'index.loading': 'جاري التحميل...',
    'index.feature.projects.title': 'المشاريع',
    'index.feature.projects.description': 'إدارة مشاريع البناء',
    'index.feature.materials.title': 'المواد',
    'index.feature.materials.description': 'إدارة المواد',
    'index.feature.documents.title': 'الوثائق',
    'index.feature.documents.description': 'إدارة الوثائق',
    'index.feature.teams.title': 'الفرق',
    'index.feature.teams.description': 'إدارة الفرق',
    'index.feature.dashboard.title': 'لوحة التحكم',
    'index.feature.dashboard.description': 'نظرة عامة',
    'index.features.title': 'الوظائف',
    'index.features.description': 'اكتشف أدوات الإدارة',
    'index.features.discover': 'اكتشاف',
    'index.features.login_to_access': 'تسجيل الدخول للوصول',
    'index.cta.title': 'ابدأ الآن',
    'index.cta.authenticated': 'الوصول إلى لوحة التحكم',
    'index.cta.unauthenticated': 'أنشئ حسابك للبدء',
    'index.cta.dashboard': 'لوحة التحكم',
    'index.cta.my_projects': 'مشاريعي',
    'index.cta.start_free': 'ابدأ مجاناً',
    'index.cta.login': 'تسجيل الدخول',

    // Footer
    'footer.about': 'حول',
    'footer.about_desc': 'نظام إدارة البناء لكفاءة المشاريع',
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.by_hadratech': 'تطوير هدرة تك',
    'footer.quick_links': 'روابط سريعة',
    'footer.legal': 'قانوني',

    // Contact
    'contact.title': 'اتصال',
  },
  
  en: {
    // App info
    'app.name': 'ADRAR Construct',
    'app.description': 'Construction Management System',

    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.materials': 'Materials',
    'nav.documents': 'Documents',
    'nav.users': 'Users',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.settings': 'Settings',
    'nav.back': 'Back',
    'nav.next': 'Next',
    'nav.previous': 'Previous',
    'nav.forward': 'Forward',
    'nav.close': 'Close',
    'nav.open': 'Open',
    'nav.tender_management': 'Tenders',

    // Dashboard translations
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to the dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.statistics': 'Statistics',
    'dashboard.recent_projects': 'Recent Projects',
    'dashboard.quick_actions': 'Quick Actions',

    // Projects
    'projects.title': 'Projects',
    'projects.all': 'All Projects',
    'projects.all_desc': 'Manage and view all projects',
    'projects.new': 'New Project',
    'projects.new_desc': 'Create a new project',
    'projects.create': 'Create Project',
    'projects.edit': 'Edit Project',
    'projects.delete': 'Delete Project',
    'projects.details': 'Project Details',
    'projects.status': 'Status',
    'projects.progress': 'Progress',
    'projects.budget': 'Budget',
    'projects.location': 'Location',
    'projects.start_date': 'Start Date',
    'projects.end_date': 'End Date',
    'projects.description': 'Description',
    'projects.team_size': 'Team Size',

    // Materials
    'materials.title': 'Materials',
    'materials.all': 'All Materials',
    'materials.create': 'Create Material',
    'materials.edit': 'Edit Material',
    'materials.delete': 'Delete Material',
    'materials.name': 'Name',
    'materials.category': 'Category',
    'materials.price': 'Price',
    'materials.quantity': 'Quantity',
    'materials.unit': 'Unit',
    'materials.available': 'Available',

    // Documents
    'documents.title': 'Documents',
    'documents.upload': 'Upload',
    'documents.download': 'Download',
    'documents.delete': 'Delete',
    'documents.view': 'View',
    'documents.edit': 'Edit',

    // Task management
    'task.title': 'Tasks',
    'task.create': 'Create Task',
    'task.edit': 'Edit Task',
    'task.delete': 'Delete Task',
    'task.assign': 'Assign',
    'task.status': 'Status',
    'task.priority': 'Priority',
    'task.due_date': 'Due Date',

    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.forgot_password': 'Forgot Password',
    'auth.reset_password': 'Reset Password',
    'auth.terms': 'Terms of Service',
    'auth.privacy': 'Privacy Policy',

    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.account': 'Account',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',

    // Language names
    'language.french': 'Français',
    'language.arabic': 'العربية',
    'language.english': 'English',

    // Common actions
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.print': 'Print',
    'common.share': 'Share',
    'common.copy': 'Copy',
    'common.paste': 'Paste',
    'common.cut': 'Cut',
    'common.undo': 'Undo',
    'common.redo': 'Redo',
    'common.select_all': 'Select All',
    'common.clear': 'Clear',
    'common.refresh': 'Refresh',
    'common.help': 'Help',
    'common.about': 'About',
    'common.version': 'Version',
    'common.contact': 'Contact',
    'common.support': 'Support',

    // Project import
    'project_import.title': 'Import Projects',
    'project_import.desc': 'Import 2025 projects',

    // Index page
    'index.loading': 'Loading...',
    'index.feature.projects.title': 'Projects',
    'index.feature.projects.description': 'Manage your construction projects',
    'index.feature.materials.title': 'Materials',
    'index.feature.materials.description': 'Materials management',
    'index.feature.documents.title': 'Documents',
    'index.feature.documents.description': 'Document management',
    'index.feature.teams.title': 'Teams',
    'index.feature.teams.description': 'Team management',
    'index.feature.dashboard.title': 'Dashboard',
    'index.feature.dashboard.description': 'Overview',
    'index.features.title': 'Features',
    'index.features.description': 'Discover our management tools',
    'index.features.discover': 'Discover',
    'index.features.login_to_access': 'Login to access',
    'index.cta.title': 'Get Started Now',
    'index.cta.authenticated': 'Access your dashboard',
    'index.cta.unauthenticated': 'Create your account to get started',
    'index.cta.dashboard': 'Dashboard',
    'index.cta.my_projects': 'My Projects',
    'index.cta.start_free': 'Start Free',
    'index.cta.login': 'Login',

    // Footer
    'footer.about': 'About',
    'footer.about_desc': 'Construction management system for project efficiency',
    'footer.rights': 'All rights reserved',
    'footer.by_hadratech': 'Developed by HadraTech',
    'footer.quick_links': 'Quick Links',
    'footer.legal': 'Legal',

    // Contact
    'contact.title': 'Contact',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
