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
      subtitle: "Gérez tous vos documents de projet en un seul endroit",
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
      drag_drop: "Glissez-déposez vos fichiers ici ou cliquez pour sélectionner",
      type: {
        inspection_report: "Rapport d'inspection",
        location_photo: "Photo de localisation",
        project_report: "Rapport de projet",
        contract: "Contrat",
        supplier_info: "Information fournisseur",
        task_assignment: "Affectation de tâche",
        employee_record: "Dossier employé",
        tender_documents: "Documents d'appel d'offres"
      },
      card: {
        click_to_view: "Cliquez pour voir les documents de ce type"
      },
      tabs: {
        all: "Tous",
        documents: "Documents",
        tender: "Appels d'offres",
        suppliers: "Fournisseurs",
        tasks: "Tâches",
        employees: "Employés",
        upload: "Télécharger",
        viewer: "Visualiser"
      },
      tender: {
        title: "Documents d'appel d'offres",
        select_project: "Sélectionnez un projet pour voir ses documents d'appel d'offres",
        select_project_placeholder: "Choisir un projet...",
        add_title: "Ajouter un document d'appel d'offres",
        add_description: "Téléchargez un nouveau document pour l'appel d'offres"
      },
      employee: {
        add: "Ajouter un employé",
        add_title: "Ajouter un nouvel employé",
        edit_title: "Modifier l'employé",
        employee_id: "ID Employé",
        employee_id_placeholder: "Entrez l'ID de l'employé",
        full_name: "Nom complet",
        full_name_placeholder: "Nom complet de l'employé",
        position: "Poste",
        position_placeholder: "Poste de l'employé",
        department: "Département",
        department_placeholder: "Département de l'employé",
        phone: "Téléphone",
        phone_placeholder: "+222 XX XX XX XX",
        email: "Email",
        email_placeholder: "email@exemple.com",
        hire_date: "Date d'embauche",
        salary: "Salaire",
        salary_placeholder: "Salaire mensuel",
        search_placeholder: "Rechercher par nom, ID ou poste...",
        id_label: "ID",
        active: "Actif",
        inactive: "Inactif",
        no_employees: "Aucun employé trouvé",
        created_successfully: "Employé créé avec succès",
        deleted_successfully: "Employé supprimé avec succès"
      }
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
      subtitle: "إدارة جميع وثائق مشروعك في مكان واحد",
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
      drag_drop: "اسحب وأفلت ملفاتك هنا أو انقر للاختيار",
      type: {
        inspection_report: "تقرير التفتيش",
        location_photo: "صورة الموقع",
        project_report: "تقرير المشروع",
        contract: "العقد",
        supplier_info: "معلومات المورد",
        task_assignment: "تعيين المهمة",
        employee_record: "سجل الموظف",
        tender_documents: "وثائق العطاء"
      },
      card: {
        click_to_view: "انقر لعرض وثائق هذا النوع"
      },
      tabs: {
        all: "الكل",
        documents: "الوثائق",
        tender: "العطاءات",
        suppliers: "الموردون",
        tasks: "المهام",
        employees: "الموظفون",
        upload: "رفع",
        viewer: "عارض"
      },
      tender: {
        title: "وثائق العطاء",
        select_project: "اختر مشروع لعرض وثائق العطاء الخاصة به",
        select_project_placeholder: "اختر مشروع...",
        add_title: "إضافة وثيقة عطاء",
        add_description: "ارفع وثيقة جديدة للعطاء"
      },
      employee: {
        add: "إضافة موظف",
        add_title: "إضافة موظف جديد",
        edit_title: "تعديل الموظف",
        employee_id: "رقم الموظف",
        employee_id_placeholder: "أدخل رقم الموظف",
        full_name: "الاسم الكامل",
        full_name_placeholder: "الاسم الكامل للموظف",
        position: "المنصب",
        position_placeholder: "منصب الموظف",
        department: "القسم",
        department_placeholder: "قسم الموظف",
        phone: "الهاتف",
        phone_placeholder: "+222 XX XX XX XX",
        email: "البريد الإلكتروني",
        email_placeholder: "email@example.com",
        hire_date: "تاريخ التوظيف",
        salary: "الراتب",
        salary_placeholder: "الراتب الشهري",
        search_placeholder: "البحث بالاسم أو الرقم أو المنصب...",
        id_label: "الرقم",
        active: "نشط",
        inactive: "غير نشط",
        no_employees: "لا يوجد موظفون",
        created_successfully: "تم إنشاء الموظف بنجاح",
        deleted_successfully: "تم حذف الموظف بنجاح"
      }
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
      subtitle: "Manage all your project documents in one place",
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
      drag_drop: "Drag and drop your files here or click to select",
      type: {
        inspection_report: "Inspection Report",
        location_photo: "Location Photo",
        project_report: "Project Report",
        contract: "Contract",
        supplier_info: "Supplier Information",
        task_assignment: "Task Assignment",
        employee_record: "Employee Record",
        tender_documents: "Tender Documents"
      },
      card: {
        click_to_view: "Click to view documents of this type"
      },
      tabs: {
        all: "All",
        documents: "Documents",
        tender: "Tenders",
        suppliers: "Suppliers",
        tasks: "Tasks",
        employees: "Employees",
        upload: "Upload",
        viewer: "Viewer"
      },
      tender: {
        title: "Tender Documents",
        select_project: "Select a project to view its tender documents",
        select_project_placeholder: "Choose a project...",
        add_title: "Add Tender Document",
        add_description: "Upload a new document for the tender"
      },
      employee: {
        add: "Add Employee",
        add_title: "Add New Employee",
        edit_title: "Edit Employee",
        employee_id: "Employee ID",
        employee_id_placeholder: "Enter employee ID",
        full_name: "Full Name",
        full_name_placeholder: "Employee full name",
        position: "Position",
        position_placeholder: "Employee position",
        department: "Department",
        department_placeholder: "Employee department",
        phone: "Phone",
        phone_placeholder: "+222 XX XX XX XX",
        email: "Email",
        email_placeholder: "email@example.com",
        hire_date: "Hire Date",
        salary: "Salary",
        salary_placeholder: "Monthly salary",
        search_placeholder: "Search by name, ID, or position...",
        id_label: "ID",
        active: "Active",
        inactive: "Inactive",
        no_employees: "No employees found",
        created_successfully: "Employee created successfully",
        deleted_successfully: "Employee deleted successfully"
      }
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
