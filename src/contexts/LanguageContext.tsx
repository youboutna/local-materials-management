
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.projects': 'Projets',
    'nav.materials': 'Matériaux',
    'nav.documents': 'Documents',
    'nav.tasks': 'Tâches',
    'nav.settings': 'Paramètres',
    'nav.users': 'Utilisateurs',

    // Language labels
    'language.french': 'Français',
    'language.arabic': 'العربية',
    'language.english': 'English',

    // Task translations
    'task.title': 'Tâches',
    'task.subtitle': 'Assignez et suivez les tâches de votre équipe',
    'task.assignments_title': 'Affectations de Tâches',
    'task.new': 'Nouvelle Tâche',
    'task.edit': 'Modifier',
    'task.create': 'Créer',
    'task.update': 'Mettre à jour',
    'task.cancel': 'Annuler',
    'task.create_sample_data': 'Créer des données d\'exemple',
    'task.assigned_to': 'Assigné à',
    'task.select_project': 'Sélectionner un projet',
    'task.select_employee': 'Sélectionner un employé',
    'task.due_date': 'Date d\'échéance',
    'task.priority': 'Priorité',
    'task.status': 'Statut',
    'task.description': 'Description',
    'task.notes': 'Notes',
    'task.priority_low': 'Faible',
    'task.priority_medium': 'Moyenne',
    'task.priority_high': 'Élevée',
    'task.status_pending': 'En attente',
    'task.status_in_progress': 'En cours',
    'task.status_completed': 'Terminé',
    'task.status_cancelled': 'Annulé',
    'task.unassigned': 'Non assigné',
    'task.due': 'Échéance',
    'task.created': 'Créé',
    'task.none_found': 'Aucune tâche trouvée',

    // Project translations
    'projects.title': 'Projets',
    'projects.subtitle': 'Gérez vos projets de construction',
    'projects.create': 'Créer un Projet',
    'projects.edit': 'Modifier le Projet',
    'projects.delete': 'Supprimer',
    'projects.view': 'Voir',
    'projects.status': 'Statut',
    'projects.budget': 'Budget',
    'projects.progress': 'Progression',
    'projects.location': 'Localisation',
    'projects.start_date': 'Date de début',
    'projects.end_date': 'Date de fin',
    'projects.team_size': 'Taille de l\'équipe',
    'projects.description': 'Description',
    'projects.none_found': 'Aucun projet trouvé',
    'projects.loading': 'Chargement des projets...',
    'projects.save': 'Enregistrer',
    'projects.cancel': 'Annuler',
    'projects.filters': 'Filtres',
    'projects.all': 'Tous les projets',
    'projects.active': 'Projets actifs',
    'projects.completed': 'Projets terminés',
    'projects.pending': 'Projets en attente',

    // Documents
    'documents.type.task_assignment': 'Affectation de Tâche',

    // Common
    'common.loading': 'Chargement...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.actions': 'Actions',
    'common.date': 'Date',
    'common.status': 'Statut',
    'common.priority': 'Priorité',
    'common.description': 'Description',
    'common.notes': 'Notes',
    'common.success': 'Succès',
    'common.error': 'Erreur',
    'common.warning': 'Attention',
    'common.info': 'Information',

    // Locale
    'locale': 'fr-FR'
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة القيادة',
    'nav.projects': 'المشاريع',
    'nav.materials': 'المواد',
    'nav.documents': 'الوثائق',
    'nav.tasks': 'المهام',
    'nav.settings': 'الإعدادات',
    'nav.users': 'المستخدمون',

    // Language labels
    'language.french': 'Français',
    'language.arabic': 'العربية',
    'language.english': 'English',

    // Task translations
    'task.title': 'المهام',
    'task.subtitle': 'قم بتعيين ومتابعة مهام فريقك',
    'task.assignments_title': 'تكليفات المهام',
    'task.new': 'مهمة جديدة',
    'task.edit': 'تعديل',
    'task.create': 'إنشاء',
    'task.update': 'تحديث',
    'task.cancel': 'إلغاء',
    'task.create_sample_data': 'إنشاء بيانات تجريبية',
    'task.assigned_to': 'مُكلف إلى',
    'task.select_project': 'اختر مشروعاً',
    'task.select_employee': 'اختر موظفاً',
    'task.due_date': 'تاريخ الاستحقاق',
    'task.priority': 'الأولوية',
    'task.status': 'الحالة',
    'task.description': 'الوصف',
    'task.notes': 'ملاحظات',
    'task.priority_low': 'منخفضة',
    'task.priority_medium': 'متوسطة',
    'task.priority_high': 'عالية',
    'task.status_pending': 'في الانتظار',
    'task.status_in_progress': 'قيد التنفيذ',
    'task.status_completed': 'مكتملة',
    'task.status_cancelled': 'ملغية',
    'task.unassigned': 'غير مُكلف',
    'task.due': 'الاستحقاق',
    'task.created': 'تم الإنشاء',
    'task.none_found': 'لم يتم العثور على مهام',

    // Project translations
    'projects.title': 'المشاريع',
    'projects.subtitle': 'إدارة مشاريع البناء الخاصة بك',
    'projects.create': 'إنشاء مشروع',
    'projects.edit': 'تعديل المشروع',
    'projects.delete': 'حذف',
    'projects.view': 'عرض',
    'projects.status': 'الحالة',
    'projects.budget': 'الميزانية',
    'projects.progress': 'التقدم',
    'projects.location': 'الموقع',
    'projects.start_date': 'تاريخ البداية',
    'projects.end_date': 'تاريخ النهاية',
    'projects.team_size': 'حجم الفريق',
    'projects.description': 'الوصف',
    'projects.none_found': 'لم يتم العثور على مشاريع',
    'projects.loading': 'جاري تحميل المشاريع...',
    'projects.save': 'حفظ',
    'projects.cancel': 'إلغاء',
    'projects.filters': 'المرشحات',
    'projects.all': 'جميع المشاريع',
    'projects.active': 'المشاريع النشطة',
    'projects.completed': 'المشاريع المكتملة',
    'projects.pending': 'المشاريع المعلقة',

    // Documents
    'documents.type.task_assignment': 'تكليف مهمة',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.actions': 'الإجراءات',
    'common.date': 'التاريخ',
    'common.status': 'الحالة',
    'common.priority': 'الأولوية',
    'common.description': 'الوصف',
    'common.notes': 'ملاحظات',
    'common.success': 'نجح',
    'common.error': 'خطأ',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',

    // Locale
    'locale': 'ar-AR'
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.materials': 'Materials',
    'nav.documents': 'Documents',
    'nav.tasks': 'Tasks',
    'nav.settings': 'Settings',
    'nav.users': 'Users',

    // Language labels
    'language.french': 'Français',
    'language.arabic': 'العربية',
    'language.english': 'English',

    // Task translations
    'task.title': 'Tasks',
    'task.subtitle': 'Assign and track your team\'s tasks',
    'task.assignments_title': 'Task Assignments',
    'task.new': 'New Task',
    'task.edit': 'Edit',
    'task.create': 'Create',
    'task.update': 'Update',
    'task.cancel': 'Cancel',
    'task.create_sample_data': 'Create Sample Data',
    'task.assigned_to': 'Assigned to',
    'task.select_project': 'Select a project',
    'task.select_employee': 'Select an employee',
    'task.due_date': 'Due Date',
    'task.priority': 'Priority',
    'task.status': 'Status',
    'task.description': 'Description',
    'task.notes': 'Notes',
    'task.priority_low': 'Low',
    'task.priority_medium': 'Medium',
    'task.priority_high': 'High',
    'task.status_pending': 'Pending',
    'task.status_in_progress': 'In Progress',
    'task.status_completed': 'Completed',
    'task.status_cancelled': 'Cancelled',
    'task.unassigned': 'Unassigned',
    'task.due': 'Due',
    'task.created': 'Created',
    'task.none_found': 'No tasks found',

    // Project translations
    'projects.title': 'Projects',
    'projects.subtitle': 'Manage your construction projects',
    'projects.create': 'Create Project',
    'projects.edit': 'Edit Project',
    'projects.delete': 'Delete',
    'projects.view': 'View',
    'projects.status': 'Status',
    'projects.budget': 'Budget',
    'projects.progress': 'Progress',
    'projects.location': 'Location',
    'projects.start_date': 'Start Date',
    'projects.end_date': 'End Date',
    'projects.team_size': 'Team Size',
    'projects.description': 'Description',
    'projects.none_found': 'No projects found',
    'projects.loading': 'Loading projects...',
    'projects.save': 'Save',
    'projects.cancel': 'Cancel',
    'projects.filters': 'Filters',
    'projects.all': 'All projects',
    'projects.active': 'Active projects',
    'projects.completed': 'Completed projects',
    'projects.pending': 'Pending projects',

    // Documents
    'documents.type.task_assignment': 'Task Assignment',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.actions': 'Actions',
    'common.date': 'Date',
    'common.status': 'Status',
    'common.priority': 'Priority',
    'common.description': 'Description',
    'common.notes': 'Notes',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Information',

    // Locale
    'locale': 'en-US'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored as Language) || 'fr';
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
