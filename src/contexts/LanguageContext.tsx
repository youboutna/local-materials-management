import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  fr: {
    nav: {
      home: "Accueil",
      projects: "Projets", 
      materials: "Matériaux",
      documents: "Documents",
      users: "Utilisateurs",
      profile: "Profil",
      settings: "Paramètres",
      tender_management: "Gestion des appels d'offres"
    },
    dashboard: {
      title: "Tableau de bord"
    },
    documents: {
      title: "Documents",
      upload: "Télécharger",
      view: "Voir", 
      download: "Télécharger",
      delete: "Supprimer",
      edit: "Modifier",
      no_documents: "Aucun document trouvé",
      upload_success: "Document téléchargé avec succès",
      upload_error: "Erreur lors du téléchargement",
      delete_success: "Document supprimé avec succès",
      delete_error: "Erreur lors de la suppression",
      delete_confirm: "Êtes-vous sûr de vouloir supprimer ce document ?",
      file_name: "Nom du fichier",
      file_size: "Taille du fichier",
      file_type: "Type de fichier",
      uploaded_by: "Téléchargé par",
      uploaded_at: "Téléchargé le",
      description: "Description",
      add_document: "Ajouter un document",
      document_type: "Type de document",
      select_file: "Sélectionner un fichier",
      drag_drop: "Glissez-déposez vos fichiers ici ou cliquez pour sélectionner"
    },
    task: {
      title: "Tâches",
      subtitle: "Assignez et suivez les tâches de votre équipe",
      create: "Créer une tâche",
      assign: "Assigner",
      complete: "Terminer",
      pending: "En attente",
      in_progress: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
      priority: "Priorité",
      high: "Élevée",
      medium: "Moyenne",
      low: "Faible",
      due_date: "Date d'échéance",
      assigned_to: "Assigné à",
      assigned_by: "Assigné par",
      description: "Description",
      notes: "Notes",
      status: "Statut",
      no_tasks: "Aucune tâche trouvée",
      create_task: "Créer une tâche",
      edit_task: "Modifier la tâche",
      delete_task: "Supprimer la tâche",
      task_created: "Tâche créée avec succès",
      task_updated: "Tâche mise à jour avec succès",
      task_deleted: "Tâche supprimée avec succès",
      task_completed: "Tâche terminée avec succès",
      overdue: "En retard",
      today: "Aujourd'hui",
      tomorrow: "Demain",
      this_week: "Cette semaine",
      next_week: "Semaine prochaine"
    },
    projects: {
      title: "Projets"
    },
    materials: {
      title: "Matériaux"
    },
    settings: {
      title: "Paramètres"
    },
    auth: {
      login: "Se connecter",
      register: "S'inscrire", 
      logout: "Se déconnecter",
      terms: "Conditions d'utilisation",
      privacy: "Politique de confidentialité"
    },
    footer: {
      about: "À propos",
      about_desc: "Notre système de gestion de construction ERP est conçu pour simplifier et optimiser tous les aspects de vos projets de construction.",
      rights: "Tous droits réservés",
      by_hadratech: "Développé par HadraTech",
      quick_links: "Liens rapides",
      legal: "Légal"
    },
    common: {
      yes: "Oui",
      no: "Non",
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      update: "Mettre à jour",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      back: "Retour",
      search: "Rechercher",
      filter: "Filtrer",
      reset: "Réinitialiser",
      submit: "Soumettre",
      close: "Fermer",
      confirm: "Confirmer",
      optional: "Optionnel",
      required: "Requis",
      yes_delete: "Oui, supprimer",
      no_cancel: "Non, annuler"
    },
    notfound: {
      message: "Page non trouvée",
      return_home: "Retour à l'accueil"
    },
    inspection: {
      edit: {
        title: "Modifier l'inspection",
        description: "Modification de l'inspection pour le projet",
        in_development: "En développement"
      },
      create: {
        title: "Créer une inspection",
        description: "Créer une nouvelle inspection pour le projet",
        in_development: "En développement"
      }
    },
    roles: {
      user: "Utilisateur"
    },
    policy: {
      title: "Politique de confidentialité",
      last_update: "Dernière mise à jour : 15 décembre 2024",
      section1: {
        title: "Collecte des informations",
        text: "Nous collectons les informations que vous nous fournissez directement lors de votre inscription et utilisation de nos services."
      },
      section2: {
        title: "Utilisation des données",
        text: "Nous utilisons vos données pour :",
        item1: "Fournir et améliorer nos services",
        item2: "Communiquer avec vous",
        item3: "Assurer la sécurité de nos services",
        item4: "Respecter nos obligations légales"
      },
      section3: {
        title: "Partage des données",
        text: "Nous ne partageons vos données personnelles qu'avec :",
        item1: "Nos partenaires de confiance",
        item2: "Les autorités compétentes si requis par la loi",
        item3: "Nos prestataires de services",
        item4: "Avec votre consentement explicite",
        item5: "Pour protéger nos droits et notre sécurité"
      },
      section4: {
        title: "Vos droits",
        text: "Vous avez le droit de :",
        item1: "Accéder à vos données personnelles",
        item2: "Corriger vos informations",
        item3: "Supprimer votre compte"
      },
      section5: {
        title: "Sécurité",
        text: "Nous mettons en place des mesures de sécurité appropriées pour protéger vos données."
      },
      section6: {
        title: "Cookies",
        text: "Nous utilisons des cookies pour :",
        item1: "Améliorer votre expérience utilisateur",
        item2: "Analyser l'utilisation de notre site",
        item3: "Personnaliser le contenu",
        item4: "Assurer la sécurité",
        item5: "Mémoriser vos préférences"
      },
      section7: {
        title: "Modifications",
        text: "Nous nous réservons le droit de modifier cette politique. Les modifications seront communiquées sur cette page."
      },
      section8: {
        title: "Contact",
        text: "Pour toute question concernant cette politique, contactez-nous à contact@example.com"
      }
    },
    contact: {
      title: "Contactez-nous",
      alert: {
        sent: "Message envoyé avec succès !"
      },
      form: {
        title: "Envoyez-nous un message",
        name: "Nom",
        name_placeholder: "Votre nom complet",
        email: "Email",
        email_placeholder: "votre@email.com",
        subject: "Sujet",
        subject_placeholder: "Sujet de votre message",
        message: "Message",
        message_placeholder: "Votre message...",
        send: "Envoyer le message"
      },
      info: {
        title: "Informations de contact",
        address: "Adresse",
        address_value: "Nouakchott, Mauritanie",
        phone: "Téléphone",
        phone_value: "+222 XX XX XX XX",
        email: "Email",
        email_value: "contact@example.com",
        hours: "Heures d'ouverture",
        hours_value: "Lun-Ven : 8h00-17h00",
        social: "Réseaux sociaux"
      }
    },
    index: {
      loading: "Chargement...",
      feature: {
        projects: {
          title: "Projets",
          description: "Gérez vos projets de construction"
        },
        materials: {
          title: "Matériaux",
          description: "Gestion des matériaux"
        },
        documents: {
          title: "Documents",
          description: "Gestion documentaire"
        },
        teams: {
          title: "Équipes",
          description: "Gestion des équipes"
        },
        dashboard: {
          title: "Tableau de bord",
          description: "Vue d'ensemble"
        }
      },
      features: {
        title: "Fonctionnalités",
        description: "Découvrez nos outils de gestion",
        discover: "Découvrir",
        login_to_access: "Se connecter pour accéder"
      },
      cta: {
        title: "Commencez dès maintenant",
        authenticated: "Accédez à votre tableau de bord",
        unauthenticated: "Créez votre compte pour commencer",
        dashboard: "Tableau de bord",
        my_projects: "Mes projets",
        start_free: "Commencer gratuitement",
        login: "Se connecter"
      }
    },
    project_create: {
      title: "Créer un nouveau projet",
      back_to_projects: "Retour aux projets",
      toast: {
        created: "Projet créé",
        created_desc: "Le projet a été créé avec succès : ",
        error: "Erreur",
        error_desc: "Une erreur est survenue lors de la création du projet."
      }
    },
    language: {
      french: "Français",
      arabic: "العربية",
      english: "English"
    },
    tender: {
      input: {
        title: "Titre",
        description: "Description",
        category: "Catégorie",
        subcategory: "Sous-catégorie"
      },
      button: {
        add: "Ajouter",
        loading: "Chargement..."
      },
      alert: {
        success: "Document ajouté avec succès",
        upload_error: "Erreur lors du téléchargement",
        document_error: "Erreur lors de la création du document",
        tenderdoc_error: "Erreur lors de la création du document d'appel d'offres"
      }
    },
    tender_category: {
      administrative: "Administratif",
      technical: "Technique",
      financial: "Financier"
    },
    tender_subcategory: {
      lettre_soumission: "Lettre de soumission",
      pouvoir_signature: "Pouvoir de signature"
    }
  },
  
  ar: {
    nav: {
      home: "الرئيسية",
      projects: "المشاريع",
      materials: "المواد",
      documents: "الوثائق",
      users: "المستخدمون",
      profile: "الملف الشخصي",
      settings: "الإعدادات",
      tender_management: "إدارة العطاءات"
    },
    dashboard: {
      title: "لوحة التحكم"
    },
    documents: {
      title: "الوثائق",
      upload: "رفع",
      view: "عرض",
      download: "تحميل",
      delete: "حذف",
      edit: "تعديل",
      no_documents: "لا توجد وثائق",
      upload_success: "تم رفع الوثيقة بنجاح",
      upload_error: "خطأ في رفع الوثيقة",
      delete_success: "تم حذف الوثيقة بنجاح",
      delete_error: "خطأ في حذف الوثيقة",
      delete_confirm: "هل أنت متأكد من حذف هذه الوثيقة؟",
      file_name: "اسم الملف",
      file_size: "حجم الملف",
      file_type: "نوع الملف",
      uploaded_by: "رفع بواسطة",
      uploaded_at: "تاريخ الرفع",
      description: "الوصف",
      add_document: "إضافة وثيقة",
      document_type: "نوع الوثيقة",
      select_file: "اختر ملف",
      drag_drop: "اسحب وأفلت ملفاتك هنا أو انقر للاختيار"
    },
    task: {
      title: "المهام",
      subtitle: "قم بتعيين ومتابعة مهام فريقك",
      create: "إنشاء مهمة",
      assign: "تعيين",
      complete: "إكمال",
      pending: "في الانتظار",
      in_progress: "قيد التنفيذ",
      completed: "مكتملة",
      cancelled: "ملغية",
      priority: "الأولوية",
      high: "عالية",
      medium: "متوسطة",
      low: "منخفضة",
      due_date: "تاريخ الاستحقاق",
      assigned_to: "معين إلى",
      assigned_by: "معين بواسطة",
      description: "الوصف",
      notes: "ملاحظات",
      status: "الحالة",
      no_tasks: "لا توجد مهام",
      create_task: "إنشاء مهمة",
      edit_task: "تعديل المهمة",
      delete_task: "حذف المهمة",
      task_created: "تم إنشاء المهمة بنجاح",
      task_updated: "تم تحديث المهمة بنجاح",
      task_deleted: "تم حذف المهمة بنجاح",
      task_completed: "تم إكمال المهمة بنجاح",
      overdue: "متأخرة",
      today: "اليوم",
      tomorrow: "غداً",
      this_week: "هذا الأسبوع",
      next_week: "الأسبوع القادم"
    },
    projects: {
      title: "المشاريع"
    },
    materials: {
      title: "المواد"
    },
    settings: {
      title: "الإعدادات"
    },
    auth: {
      login: "تسجيل الدخول",
      register: "التسجيل",
      logout: "تسجيل الخروج",
      terms: "شروط الاستخدام",
      privacy: "سياسة الخصوصية"
    },
    footer: {
      about: "حول",
      about_desc: "نظام إدارة البناء ERP مصمم لتبسيط وتحسين جميع جوانب مشاريع البناء الخاصة بك.",
      rights: "جميع الحقوق محفوظة",
      by_hadratech: "تطوير هدرة تك",
      quick_links: "روابط سريعة",
      legal: "قانوني"
    },
    common: {
      yes: "نعم",
      no: "لا",
      cancel: "إلغاء",
      save: "حفظ",
      delete: "حذف",
      edit: "تعديل",
      update: "تحديث",
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجاح",
      back: "عودة",
      search: "بحث",
      filter: "تصفية",
      reset: "إعادة تعيين",
      submit: "إرسال",
      close: "إغلاق",
      confirm: "تأكيد",
      optional: "اختياري",
      required: "مطلوب",
      yes_delete: "نعم، احذف",
      no_cancel: "لا، إلغاء"
    },
    notfound: {
      message: "الصفحة غير موجودة",
      return_home: "العودة للرئيسية"
    },
    inspection: {
      edit: {
        title: "تعديل التفتيش",
        description: "تعديل التفتيش للمشروع",
        in_development: "قيد التطوير"
      },
      create: {
        title: "إنشاء تفتيش",
        description: "إنشاء تفتيش جديد للمشروع",
        in_development: "قيد التطوير"
      }
    },
    roles: {
      user: "مستخدم"
    },
    policy: {
      title: "سياسة الخصوصية",
      last_update: "آخر تحديث: 15 ديسمبر 2024",
      section1: {
        title: "جمع المعلومات",
        text: "نحن نجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل واستخدام خدماتنا."
      },
      section2: {
        title: "استخدام البيانات",
        text: "نستخدم بياناتك من أجل:",
        item1: "تقديم وتحسين خدماتنا",
        item2: "التواصل معك",
        item3: "ضمان أمان خدماتنا",
        item4: "احترام التزاماتنا القانونية"
      },
      section3: {
        title: "مشاركة البيانات",
        text: "نحن لا نشارك بياناتك الشخصية إلا مع:",
        item1: "شركاؤنا الموثوقون",
        item2: "السلطات المختصة إذا طلب القانون",
        item3: "مقدمي الخدمات",
        item4: "بموافقتك الصريحة",
        item5: "لحماية حقوقنا وأمننا"
      },
      section4: {
        title: "حقوقك",
        text: "لديك الحق في:",
        item1: "الوصول إلى بياناتك الشخصية",
        item2: "تصحيح معلوماتك",
        item3: "حذف حسابك"
      },
      section5: {
        title: "الأمان",
        text: "نضع تدابير أمنية مناسبة لحماية بياناتك."
      },
      section6: {
        title: "ملفات تعريف الارتباط",
        text: "نستخدم ملفات تعريف الارتباط من أجل:",
        item1: "تحسين تجربة المستخدم",
        item2: "تحليل استخدام موقعنا",
        item3: "تخصيص المحتوى",
        item4: "ضمان الأمان",
        item5: "تذكر تفضيلاتك"
      },
      section7: {
        title: "التعديلات",
        text: "نحتفظ بالحق في تعديل هذه السياسة. سيتم الإعلان عن التعديلات في هذه الصفحة."
      },
      section8: {
        title: "الاتصال",
        text: "لأي أسئلة حول هذه السياسة، اتصل بنا على contact@example.com"
      }
    },
    contact: {
      title: "اتصل بنا",
      alert: {
        sent: "تم إرسال الرسالة بنجاح!"
      },
      form: {
        title: "أرسل لنا رسالة",
        name: "الاسم",
        name_placeholder: "اسمك الكامل",
        email: "البريد الإلكتروني",
        email_placeholder: "your@email.com",
        subject: "الموضوع",
        subject_placeholder: "موضوع رسالتك",
        message: "الرسالة",
        message_placeholder: "رسالتك...",
        send: "إرسال الرسالة"
      },
      info: {
        title: "معلومات الاتصال",
        address: "العنوان",
        address_value: "نواكشوط، موريتانيا",
        phone: "الهاتف",
        phone_value: "+222 XX XX XX XX",
        email: "البريد الإلكتروني",
        email_value: "contact@example.com",
        hours: "ساعات العمل",
        hours_value: "الاثنين-الجمعة: 8:00-17:00",
        social: "وسائل التواصل الاجتماعي"
      }
    },
    index: {
      loading: "جاري التحميل...",
      feature: {
        projects: {
          title: "المشاريع",
          description: "إدارة مشاريع البناء"
        },
        materials: {
          title: "المواد",
          description: "إدارة المواد"
        },
        documents: {
          title: "الوثائق",
          description: "إدارة الوثائق"
        },
        teams: {
          title: "الفرق",
          description: "إدارة الفرق"
        },
        dashboard: {
          title: "لوحة التحكم",
          description: "نظرة عامة"
        }
      },
      features: {
        title: "الميزات",
        description: "اكتشف أدوات الإدارة لدينا",
        discover: "اكتشف",
        login_to_access: "تسجيل الدخول للوصول"
      },
      cta: {
        title: "ابدأ الآن",
        authenticated: "انتقل إلى لوحة التحكم",
        unauthenticated: "أنشئ حسابك للبدء",
        dashboard: "لوحة التحكم",
        my_projects: "مشاريعي",
        start_free: "ابدأ مجاناً",
        login: "تسجيل الدخول"
      }
    },
    project_create: {
      title: "إنشاء مشروع جديد",
      back_to_projects: "العودة للمشاريع",
      toast: {
        created: "تم إنشاء المشروع",
        created_desc: "تم إنشاء المشروع بنجاح: ",
        error: "خطأ",
        error_desc: "حدث خطأ أثناء إنشاء المشروع."
      }
    },
    language: {
      french: "Français",
      arabic: "العربية",
      english: "English"
    },
    tender: {
      input: {
        title: "العنوان",
        description: "الوصف",
        category: "الفئة",
        subcategory: "الفئة الفرعية"
      },
      button: {
        add: "إضافة",
        loading: "جاري التحميل..."
      },
      alert: {
        success: "تم إضافة الوثيقة بنجاح",
        upload_error: "خطأ في الرفع",
        document_error: "خطأ في إنشاء الوثيقة",
        tenderdoc_error: "خطأ في إنشاء وثيقة العطاء"
      }
    },
    tender_category: {
      administrative: "إداري",
      technical: "تقني",
      financial: "مالي"
    },
    tender_subcategory: {
      lettre_soumission: "خطاب التقديم",
      pouvoir_signature: "تفويض التوقيع"
    }
  },
  
  en: {
    nav: {
      home: "Home",
      projects: "Projects",
      materials: "Materials",
      documents: "Documents",
      users: "Users",
      profile: "Profile",
      settings: "Settings",
      tender_management: "Tender Management"
    },
    dashboard: {
      title: "Dashboard"
    },
    documents: {
      title: "Documents",
      upload: "Upload",
      view: "View",
      download: "Download",
      delete: "Delete",
      edit: "Edit",
      no_documents: "No documents found",
      upload_success: "Document uploaded successfully",
      upload_error: "Error uploading document",
      delete_success: "Document deleted successfully",
      delete_error: "Error deleting document",
      delete_confirm: "Are you sure you want to delete this document?",
      file_name: "File name",
      file_size: "File size",
      file_type: "File type",
      uploaded_by: "Uploaded by",
      uploaded_at: "Uploaded at",
      description: "Description",
      add_document: "Add document",
      document_type: "Document type",
      select_file: "Select file",
      drag_drop: "Drag and drop your files here or click to select"
    },
    task: {
      title: "Tasks",
      subtitle: "Assign and track your team's tasks",
      create: "Create task",
      assign: "Assign",
      complete: "Complete",
      pending: "Pending",
      in_progress: "In progress",
      completed: "Completed",
      cancelled: "Cancelled",
      priority: "Priority",
      high: "High",
      medium: "Medium",
      low: "Low",
      due_date: "Due date",
      assigned_to: "Assigned to",
      assigned_by: "Assigned by",
      description: "Description",
      notes: "Notes",
      status: "Status",
      no_tasks: "No tasks found",
      create_task: "Create task",
      edit_task: "Edit task",
      delete_task: "Delete task",
      task_created: "Task created successfully",
      task_updated: "Task updated successfully",
      task_deleted: "Task deleted successfully",
      task_completed: "Task completed successfully",
      overdue: "Overdue",
      today: "Today",
      tomorrow: "Tomorrow",
      this_week: "This week",
      next_week: "Next week"
    },
    projects: {
      title: "Projects"
    },
    materials: {
      title: "Materials"
    },
    settings: {
      title: "Settings"
    },
    auth: {
      login: "Sign in",
      register: "Sign up",
      logout: "Sign out",
      terms: "Terms of Service",
      privacy: "Privacy Policy"
    },
    footer: {
      about: "About",
      about_desc: "Our construction management ERP system is designed to simplify and optimize all aspects of your construction projects.",
      rights: "All rights reserved",
      by_hadratech: "Developed by HadraTech",
      quick_links: "Quick Links",
      legal: "Legal"
    },
    common: {
      yes: "Yes",
      no: "No",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      update: "Update",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      back: "Back",
      search: "Search",
      filter: "Filter",
      reset: "Reset",
      submit: "Submit",
      close: "Close",
      confirm: "Confirm",
      optional: "Optional",
      required: "Required",
      yes_delete: "Yes, delete",
      no_cancel: "No, cancel"
    },
    notfound: {
      message: "Page not found",
      return_home: "Return home"
    },
    inspection: {
      edit: {
        title: "Edit Inspection",
        description: "Edit inspection for project",
        in_development: "In development"
      },
      create: {
        title: "Create Inspection",
        description: "Create new inspection for project",
        in_development: "In development"
      }
    },
    roles: {
      user: "User"
    },
    policy: {
      title: "Privacy Policy",
      last_update: "Last updated: December 15, 2024",
      section1: {
        title: "Information Collection",
        text: "We collect information that you provide to us directly when registering and using our services."
      },
      section2: {
        title: "Data Usage",
        text: "We use your data to:",
        item1: "Provide and improve our services",
        item2: "Communicate with you",
        item3: "Ensure the security of our services",
        item4: "Comply with our legal obligations"
      },
      section3: {
        title: "Data Sharing",
        text: "We only share your personal data with:",
        item1: "Our trusted partners",
        item2: "Competent authorities if required by law",
        item3: "Our service providers",
        item4: "With your explicit consent",
        item5: "To protect our rights and security"
      },
      section4: {
        title: "Your Rights",
        text: "You have the right to:",
        item1: "Access your personal data",
        item2: "Correct your information",
        item3: "Delete your account"
      },
      section5: {
        title: "Security",
        text: "We implement appropriate security measures to protect your data."
      },
      section6: {
        title: "Cookies",
        text: "We use cookies to:",
        item1: "Improve your user experience",
        item2: "Analyze our site usage",
        item3: "Personalize content",
        item4: "Ensure security",
        item5: "Remember your preferences"
      },
      section7: {
        title: "Modifications",
        text: "We reserve the right to modify this policy. Changes will be communicated on this page."
      },
      section8: {
        title: "Contact",
        text: "For any questions about this policy, contact us at contact@example.com"
      }
    },
    contact: {
      title: "Contact Us",
      alert: {
        sent: "Message sent successfully!"
      },
      form: {
        title: "Send us a message",
        name: "Name",
        name_placeholder: "Your full name",
        email: "Email",
        email_placeholder: "your@email.com",
        subject: "Subject",
        subject_placeholder: "Subject of your message",
        message: "Message",
        message_placeholder: "Your message...",
        send: "Send message"
      },
      info: {
        title: "Contact Information",
        address: "Address",
        address_value: "Nouakchott, Mauritania",
        phone: "Phone",
        phone_value: "+222 XX XX XX XX",
        email: "Email",
        email_value: "contact@example.com",
        hours: "Opening Hours",
        hours_value: "Mon-Fri: 8:00 AM - 5:00 PM",
        social: "Social Media"
      }
    },
    index: {
      loading: "Loading...",
      feature: {
        projects: {
          title: "Projects",
          description: "Manage your construction projects"
        },
        materials: {
          title: "Materials",
          description: "Materials management"
        },
        documents: {
          title: "Documents",
          description: "Document management"
        },
        teams: {
          title: "Teams",
          description: "Team management"
        },
        dashboard: {
          title: "Dashboard",
          description: "Overview"
        }
      },
      features: {
        title: "Features",
        description: "Discover our management tools",
        discover: "Discover",
        login_to_access: "Login to access"
      },
      cta: {
        title: "Get Started Now",
        authenticated: "Access your dashboard",
        unauthenticated: "Create your account to get started",
        dashboard: "Dashboard",
        my_projects: "My projects",
        start_free: "Start for free",
        login: "Sign in"
      }
    },
    project_create: {
      title: "Create New Project",
      back_to_projects: "Back to projects",
      toast: {
        created: "Project created",
        created_desc: "Project created successfully: ",
        error: "Error",
        error_desc: "An error occurred while creating the project."
      }
    },
    language: {
      french: "Français",
      arabic: "العربية",
      english: "English"
    },
    tender: {
      input: {
        title: "Title",
        description: "Description",
        category: "Category",
        subcategory: "Subcategory"
      },
      button: {
        add: "Add",
        loading: "Loading..."
      },
      alert: {
        success: "Document added successfully",
        upload_error: "Upload error",
        document_error: "Document creation error",
        tenderdoc_error: "Tender document creation error"
      }
    },
    tender_category: {
      administrative: "Administrative",
      technical: "Technical",
      financial: "Financial"
    },
    tender_subcategory: {
      lettre_soumission: "Submission Letter",
      pouvoir_signature: "Signature Power"
    }
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['fr', 'ar', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key "${key}" not found for language "${language}"`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
