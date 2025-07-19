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

export const translations = {
  fr: {
    nav: {
      home: "Accueil",
      projects: "Projets",
      materials: "Matériaux",
      documents: "Documents",
      users: "Utilisateurs",
      profile: "Profil",
      settings: "Paramètres",
      tender_management: "Gestion des appels d'offres",
          login: "Login",
      register: "Register",
      logout: "Logout",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      full_name: "Full Name",
      phone: "Phone",
      national_id: "National ID",
      email: "Email",
      password: "Password",
      password_requirements: "Password requirements",
      button: {
        loading: "Loading..."
      }

    },
    user: {
      profile: "Profil utilisateur",
      name: "Nom",
      email: "Email",
      role: "Rôle",
      status: "Statut",
      active: "Actif",
      inactive: "Inactif",
      created_at: "Créé le",
      updated_at: "Mis à jour le",
      edit_profile: "Modifier le profil",
      change_password: "Changer le mot de passe",
      logout: "Se déconnecter",
      preferences: "Préférences",
      notifications: "Notifications",
      account_settings: "Paramètres du compte",
      delete_account: "Supprimer le compte",
      confirm_delete: "Confirmer la suppression",
      user_management: "Gestion des utilisateurs",
      add_user: "Ajouter un utilisateur",
      edit_user: "Modifier l'utilisateur",
      user_details: "Détails de l'utilisateur",
      permissions: "Permissions",
      last_login: "Dernière connexion",
      never: "Jamais"
    },
    users: {
      edit: "Modifier la utilisateur",
      title: "Utilisateurs",
      subtitle: "Gérer les utilisateurs du système",
      add_user: "Ajouter un utilisateur",
      edit_user: "Modifier l'utilisateur",
      delete_user: "Supprimer l'utilisateur",
      user_list: "Liste des utilisateurs",
      user_details: "Détails de l'utilisateur",
      no_users: "Aucun utilisateur trouvé",
      search_placeholder: "Rechercher un utilisateur...",
      filter_by_role: "Filtrer par rôle",
      filter_by_status: "Filtrer par statut",
      total_users: "Total des utilisateurs",
      active_users: "Utilisateurs actifs",
      inactive_users: "Utilisateurs inactifs",
      active: "Utilisateurs actifs",
      inactive: "Utilisateurs inactifs",
      recent_users: "Utilisateurs récents",
      user_created: "Utilisateur créé avec succès",
      user_updated: "Utilisateur mis à jour avec succès",
      user_deleted: "Utilisateur supprimé avec succès",
      confirm_delete_message: "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
      bulk_actions: "Actions en lot",
      select_all: "Tout sélectionner",
      deselect_all: "Tout désélectionner",
      export_users: "Exporter les utilisateurs",
      import_users: "Importer les utilisateurs",
      management: {
        title: "Gestion des utilisateurs",
        description: "Administrer les comptes utilisateurs et leurs permissions",
        roles: {
          admin: "Administrateur",
          user: "Utilisateur",
          manager: "Gestionnaire",
          viewer: "Observateur"
        },
        permissions: {
          read: "Lecture",
          write: "Écriture",
          delete: "Suppression",
          admin: "Administration"
        },
        actions: {
          activate: "Activer",
          deactivate: "Désactiver",
          reset_password: "Réinitialiser le mot de passe",
          send_invitation: "Envoyer une invitation",
          revoke_access: "Révoquer l'accès"
        }
      },
      table: {
        name: "Nom",
        phone: "Téléphone",
        national_id: "ID National",
        role: "Rôle",
        status: "Statut",
        actions: "Actions"
      },
      details: {
        login: "Se connecter",
        register: "S'inscrire",
        logout: "Se déconnecter",
        terms: "Conditions d'utilisation",
        privacy: "Politique de confidentialité"
      },
      details_title: "Détails de l'utilisateur",
      new: "Nouvel utilisateur",
      created: "Utilisateur créé",
      updated: "Utilisateur mis à jour",
      manage_roles: "Gérer les rôles",
      none_found: "Aucun utilisateur trouvé",
      no_results: "Aucun résultat trouvé"
    },
    dashboard: {
      title: "Tableau de bord",
      welcome: "Bienvenue",
      team_members: "Members",
      overview: "Vue d'ensemble",
      statistics: "Statistiques",
      recent_activity: "Activité récente",
      quick_actions: "Actions rapides",
      projects_count: "Nombre de projets",
      materials_count: "Nombre de matériaux",
      documents_count: "Nombre de documents",
      users_count: "Nombre d'utilisateurs",
      recent_projects: "Projets récents",
      pending_tasks: "Tâches en attente",
      notifications: "Notifications",
      alerts: "Alertes",
      system_status: "État du système",
      performance: "Performance",
      analytics: "Analyses",
      reports: "Rapports",
      export_data: "Exporter les données",
      refresh: "Actualiser",
      loading_dashboard: "Chargement du tableau de bord...",
      no_data: "Aucune donnée disponible",
      error_loading: "Erreur lors du chargement des données",
      active_projects: "Projets actifs",
      status_overview: "Vue d'ensemble du statut",
      active_projects_label: "projets actifs",
      total_budget: "Budget total",
      financial_resources: "Ressources financières",
      team: "Équipe",
      project_staff: "Personnel de projet",
      members: "membres",
      materials: "Matériaux",
      available_resources: "Ressources disponibles",
      types: "types",
      project_progress: "Progression du projet",
      view_all: "Voir tout",
      no_projects: "Aucun projet",
      distribution_by_region: "Répartition par région",
      project_distribution: "Répartition des projets",
      no_geolocated_projects: "Aucun projet géolocalisé",
      dev_mode: "Mode développement"
    },
    task: {
      title: "Tâches",
      subtitle: "Assignez et suivez les tâches de votre équipe",
      assignments_title: "Affectations de tâches",
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
      urgent: "Urgente",
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
      next_week: "Semaine prochaine",
      completion_notes: "Notes de completion",
      completion_notes_placeholder: "Ajoutez des notes sur la completion de cette tâche...",
      mark_completed: "Marquer comme terminé",
      marking_progress: "Marquage en cours...",
      completion_success: "Tâche terminée le",
      assignment: "Affectation",
      assignments: "Affectations",
      project: "Projet",
      location: "Localisation",
      completion_date: "Date de completion",
      task_details: "Détails de la tâche",
      optional: "optionnel",
      task_list: "Liste des tâches",
      filter_tasks: "Filtrer les tâches",
      sort_tasks: "Trier les tâches",
      task_progress: "Progression de la tâche",
      task_comments: "Commentaires de la tâche",
      add_comment: "Ajouter un commentaire",
      task_history: "Historique de la tâche",
      task_files: "Fichiers de la tâche",
      attach_file: "Joindre un fichier",
      task_reminders: "Rappels de tâche",
      set_reminder: "Définir un rappel",
      task_dependencies: "Dépendances de la tâche",
      add_dependency: "Ajouter une dépendance",
      task_subtasks: "Sous-tâches",
      add_subtask: "Ajouter une sous-tâche",
      task_time_tracking: "Suivi du temps",
      start_timer: "Démarrer le minuteur",
      stop_timer: "Arrêter le minuteur",
      time_spent: "Temps passé",
      estimated_time: "Temps estimé",
      priority_high: "Haute priorité",
      priority_medium: "Priorité moyenne",
      priority_low: "Basse priorité",
      priority_urgent: "Priorité urgente",
      status_in_progress: "En cours",
      status_pending: "En attente",
      status_completed: "Terminée",
      status_cancelled: "Annulée",
      create_sample_data: "Créer des données d'exemple",
      new: "Nouvelle Tâche",
      select_project: "Sélectionner un projet",
      select_employee: "Sélectionner un employé",
      unassigned: "Non assigné",
      due: "Échéance",
      created: "Créé",
      none_found: "Aucune tâche trouvée"
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
    projects: {
      title: "Projets"
    },
    materials: {
      title: "Matériaux",
      basic_info: "Informations de base",
      name: "Nom",
      category: "Catégorie",
      description: "Description",
      unit: "Unité",
      price_per_unit: "Prix par unité",
      available_quantity: "Quantité disponible",
      location_info: "Informations de localisation",
      origin_location: "Lieu d'origine",
      coordinates: "Coordonnées",
      image: "Image",
      workspace: "Espace de travail",
      form: {
        name_placeholder: "Nom du matériau",
        description_placeholder: "Description du matériau",
        category_placeholder: "Sélectionner une catégorie",
        unit_placeholder: "ex: m², kg, unité",
        price_placeholder: "Prix unitaire",
        quantity_placeholder: "Quantité disponible",
        location_placeholder: "Lieu d'origine",
        select_workspace: "Sélectionner un espace de travail"
      },
      validation: {
        name_required: "Le nom est requis",
        category_required: "La catégorie est requise",
        description_required: "La description est requise",
        unit_required: "L'unité est requise",
        price_required: "Le prix est requis",
        quantity_required: "La quantité est requise"
      }
    },
    settings: {
      title: "Paramètres"
    },
    auth: {
      login: "Se connecter",
      register: "S'inscrire",
      logout: "Se déconnecter",
      terms: "Conditions d'utilisation",
      privacy: "Politique de confidentialité",
      full_name: "Nom complet",
      phone: "Téléphone",
      national_id: "ID National",
      email: "Email",
      password: "Mot de passe",
      password_requirements: "Exigences du mot de passe",
      button: {
        loading: "Chargement..."
      }
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
      user: "Utilisateur",
      admin: "Administrateur",
      project_manager: "Gestionnaire de projet",
      supervisor: "Superviseur",
      inspector: "Inspecteur",
      supplier: "Fournisseur",
      viewer: "Observateur",
      assigned: "Rôle assigné",
      assigned_success: "Rôle assigné avec succès",
      assign_error: "Erreur lors de l'assignation du rôle",
      removed: "Rôle supprimé",
      removed_success: "Rôle supprimé avec succès",
      remove_error: "Erreur lors de la suppression du rôle"
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
      },
      form: {
        title: "Titre",
        description: "Description",
        location: "Localisation",
        status: "Statut",
        budget: "Budget",
        start_date: "Date de début",
        end_date: "Date de fin",
        team_size: "Taille de l'équipe",
        progress: "Progression",
        financing_source: "Source de financement",
        market_type: "Type de marché",
        selection_mode: "Mode de sélection",
        project_responsable: "Responsable du projet",
        main_contractor: "Entrepreneur principal",
        project_reference: "Référence du projet",
        allows_initial_payment: "Autoriser le paiement initial",
        initial_payment_percentage: "Pourcentage de paiement initial",
        current_phase: "Phase actuelle",
        current_stage: "Étape actuelle",
        coordinates: "Coordonnées",
        facilities_location: "Localisation des installations"
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
        login: "تسجيل الدخول",
      register: "التسجيل",
      logout: "تسجيل الخروج",
      terms: "شروط الاستخدام",
      privacy: "سياسة الخصوصية",
      full_name: "الاسم الكامل",
      phone: "الهاتف",
      national_id: "رقم الهوية الوطنية",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      password_requirements: "متطلبات كلمة المرور",
      button: {
        loading: "جاري التحميل..."
      },
      home: "الرئيسية",
      projects: "المشاريع",
      materials: "المواد",
      documents: "الوثائق",
      users: "المستخدمون",
      profile: "الملف الشخصي",
      settings: "الإعدادات",
      tender_management: "إدارة العطاءات"
    },
    user: {
      profile: "ملف المستخدم",
      name: "الاسم",
      email: "البريد الإلكتروني",
      role: "الدور",
      status: "الحالة",
      active: "نشط",
      inactive: "غير نشط",
      created_at: "تم الإنشاء في",
      updated_at: "تم التحديث في",
      edit_profile: "تعديل الملف الشخصي",
      change_password: "تغيير كلمة المرور",
      logout: "تسجيل الخروج",
      preferences: "التفضيلات",
      notifications: "الإشعارات",
      account_settings: "إعدادات الحساب",
      delete_account: "حذف الحساب",
      confirm_delete: "تأكيد الحذف",
      user_management: "إدارة المستخدمين",
      add_user: "إضافة مستخدم",
      edit_user: "تعديل المستخدم",
      user_details: "تفاصيل المستخدم",
      permissions: "الأذونات",
      last_login: "آخر تسجيل دخول",
      never: "أبداً"
    },
    users: {
      edit: "تعديل المهمة",
      title: "المستخدمون",
      subtitle: "إدارة مستخدمي النظام",
      add_user: "إضافة مستخدم",
      edit_user: "تعديل المستخدم",
      delete_user: "حذف المستخدم",
      user_list: "قائمة المستخدمين",
      user_details: "تفاصيل المستخدم",
      no_users: "لا يوجد مستخدمون",
      search_placeholder: "البحث عن مستخدم...",
      filter_by_role: "تصفية حسب الدور",
      filter_by_status: "تصفية حسب الحالة",
      total_users: "إجمالي المستخدمين",
      active_users: "المستخدمون النشطون",
      active: "المستخدمون النشطون",
      inactive_users: "المستخدمون غير النشطين",
      recent_users: "المستخدمون الجدد",
      user_created: "تم إنشاء المستخدم بنجاح",
      user_updated: "تم تحديث المستخدم بنجاح",
      user_deleted: "تم حذف المستخدم بنجاح",
      confirm_delete_message: "هل أنت متأكد من حذف هذا المستخدم؟",
      bulk_actions: "إجراءات مجمعة",
      select_all: "تحديد الكل",
      deselect_all: "إلغاء تحديد الكل",
      export_users: "تصدير المستخدمين",
      import_users: "استيراد المستخدمين",
      management: {
        title: "إدارة المستخدمين",
        description: "إدارة حسابات المستخدمين وصلاحياتهم",
        roles: {
          admin: "مدير",
          user: "مستخدم",
          manager: "مدير قسم",
          viewer: "مشاهد"
        },
        permissions: {
          read: "قراءة",
          write: "كتابة",
          delete: "حذف",
          admin: "إدارة"
        },
        actions: {
          activate: "تفعيل",
          deactivate: "إلغاء التفعيل",
          reset_password: "إعادة تعيين كلمة المرور",
          send_invitation: "إرسال دعوة",
          revoke_access: "إلغاء الوصول"
        }
      },
      table: {
        name: "الاسم",
        phone: "الهاتف",
        national_id: "الرقم الوطني",
        role: "الدور",
        status: "الحالة",
        actions: "إجراءات"
      },
      details: {
        login: "تسجيل الدخول",
        register: "التسجيل",
        logout: "تسجيل الخروج",
        terms: "شروط الاستخدام",
        privacy: "سياسة الخصوصية"
      },
      details_title: "تفاصيل المستخدم",
      new: "مستخدم جديد",
      created: "تم إنشاء المستخدم",
      updated: "تم تحديث المستخدم",
      manage_roles: "إدارة الأدوار",
      none_found: "لا يوجد مستخدمون",
      no_results: "لا توجد نتائج"
    },
    dashboard: {
      title: "لوحة التحكم",
      welcome: "مرحباً",
      overview: "نظرة عامة",
      statistics: "الإحصائيات",
      recent_activity: "النشاط الأخير",
      quick_actions: "الإجراءات السريعة",
      projects_count: "عدد المشاريع",
      materials_count: "عدد المواد",
      documents_count: "عدد الوثائق",
      users_count: "عدد المستخدمين",
      recent_projects: "المشاريع الأخيرة",
      pending_tasks: "المهام المعلقة",
      notifications: "الإشعارات",
      alerts: "التنبيهات",
      system_status: "حالة النظام",
      performance: "الأداء",
      analytics: "التحليلات",
      reports: "التقارير",
      export_data: "تصدير البيانات",
      refresh: "تحديث",
      loading_dashboard: "جاري تحميل لوحة التحكم...",
      no_data: "لا توجد بيانات متاحة",
      error_loading: "خطأ في تحميل البيانات",
      active_projects: "المشاريع النشطة",
      status_overview: "نظرة عامة على الحالة",
      active_projects_label: "مشاريع نشطة",
      total_budget: "الميزانية الإجمالية",
      financial_resources: "الموارد المالية",
      team: "الفريق",
      project_staff: "موظفو المشروع",
      members: "أعضاء",
      materials: "المواد",
      available_resources: "الموارد المتاحة",
      types: "أنواع",
      project_progress: "تقدم المشروع",
      view_all: "عرض الكل",
      no_projects: "لا توجد مشاريع",
      distribution_by_region: "التوزيع حسب المنطقة",
      project_distribution: "توزيع المشاريع",
      no_geolocated_projects: "لا توجد مشاريع محددة جغرافياً",
      dev_mode: "وضع التطوير"
    },
    task: {
      title: "المهام",
      subtitle: "قم بتعيين ومتابعة مهام فريقك",
      assignments_title: "تعيينات المهام",
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
      urgent: "عاجلة",
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
      next_week: "الأسبوع القادم",
      completion_notes: "ملاحظات الإكمال",
      completion_notes_placeholder: "أضف ملاحظات حول إكمال هذه المهمة...",
      mark_completed: "تحديد كمكتملة",
      marking_progress: "جاري التحديد...",
      completion_success: "تم إكمال المهمة في",
      assignment: "تعيين",
      assignments: "التعيينات",
      project: "المشروع",
      location: "الموقع",
      completion_date: "تاريخ الإكمال",
      task_details: "تفاصيل المهمة",
      optional: "اختياري",
      task_list: "قائمة المهام",
      filter_tasks: "تصفية المهام",
      sort_tasks: "ترتيب المهام",
      task_progress: "تقدم المهمة",
      task_comments: "تعليقات المهمة",
      add_comment: "إضافة تعليق",
      task_history: "تاريخ المهمة",
      task_files: "ملفات المهمة",
      attach_file: "إرفاق ملف",
      task_reminders: "تذكيرات المهمة",
      set_reminder: "تعيين تذكير",
      task_dependencies: "تبعيات المهمة",
      add_dependency: "إضافة تبعية",
      task_subtasks: "المهام الفرعية",
      add_subtask: "إضافة مهمة فرعية",
      task_time_tracking: "تتبع الوقت",
      start_timer: "بدء المؤقت",
      stop_timer: "إيقاف المؤقت",
      time_spent: "الوقت المستغرق",
      estimated_time: "الوقت المقدر",
      priority_high: "أولوية عالية",
      priority_medium: "أولوية متوسطة",
      priority_low: "أولوية منخفضة",
      priority_urgent: "أولوية عاجلة",
      status_in_progress: "قيد التنفيذ",
      status_pending: "في الانتظار",
      status_completed: "مكتملة",
      status_cancelled: "ملغية",
      create_sample_data: "إنشاء بيانات عينة",
      new: "مهمة جديدة",
      select_project: "اختر مشروعًا",
      select_employee: "اختر موظفًا",
      unassigned: "غير معين",
      due: "مستحق",
      created: "تم الإنشاء",
      none_found: "لا توجد مهام"
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
    projects: {
      title: "المشاريع"
    },
    materials: {
      title: "المواد",
      basic_info: "المعلومات الأساسية",
      name: "الاسم",
      category: "الفئة",
      description: "الوصف",
      unit: "الوحدة",
      price_per_unit: "السعر لكل وحدة",
      available_quantity: "الكمية المتاحة",
      location_info: "معلومات الموقع",
      origin_location: "موقع المنشأ",
      coordinates: "الإحداثيات",
      image: "الصورة",
      workspace: "مساحة العمل",
      form: {
        name_placeholder: "اسم المادة",
        description_placeholder: "وصف المادة",
        category_placeholder: "اختر فئة",
        unit_placeholder: "مثل: م²، كغ، وحدة",
        price_placeholder: "السعر للوحدة",
        quantity_placeholder: "الكمية المتاحة",
        location_placeholder: "موقع المنشأ",
        select_workspace: "اختر مساحة عمل"
      },
      validation: {
        name_required: "الاسم مطلوب",
        category_required: "الفئة مطلوبة",
        description_required: "الوصف مطلوب",
        unit_required: "الوحدة مطلوبة",
        price_required: "السعر مطلوب",
        quantity_required: "الكمية مطلوبة"
      }
    },
    settings: {
      title: "الإعدادات"
    },
    auth: {
      login: "تسجيل الدخول",
      register: "التسجيل",
      logout: "تسجيل الخروج",
      terms: "شروط الاستخدام",
      privacy: "سياسة الخصوصية",
      full_name: "الاسم الكامل",
      phone: "الهاتف",
      national_id: "رقم الهوية الوطنية",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      password_requirements: "متطلبات كلمة المرور",
      button: {
        loading: "جاري التحميل..."
      }
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
      user: "مستخدم",
      admin: "مدير",
      project_manager: "مدير مشروع",
      supervisor: "مشرف",
      inspector: "مفتش",
      supplier: "مورد",
      viewer: "مشاهد",
      assigned: "دور معين",
      assigned_success: "تم تعيين الدور بنجاح",
      assign_error: "خطأ في تعيين الدور",
      removed: "دور مزال",
      removed_success: "تم إزالة الدور بنجاح",
      remove_error: "خطأ في إزالة الدور"
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
      },
      form: {
        title: "العنوان",
        description: "الوصف",
        location: "الموقع",
        status: "الحالة",
        budget: "الميزانية",
        start_date: "تاريخ البداية",
        end_date: "تاريخ النهاية",
        team_size: "حجم الفريق",
        progress: "التقدم",
        financing_source: "مصدر التمويل",
        market_type: "نوع السوق",
        selection_mode: "طريقة الاختيار",
        project_responsable: "مسؤول المشروع",
        main_contractor: "المقاول الرئيسي",
        project_reference: "مرجع المشروع",
        allows_initial_payment: "السماح بالدفع الأولي",
        initial_payment_percentage: "نسبة الدفع الأولي",
        current_phase: "المرحلة الحالية",
        current_stage: "الخطوة الحالية",
        coordinates: "الإحداثيات",
        facilities_location: "موقع المرافق"
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
      administrative: "مدير",
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
      tender_management: "Tender Management",
            login: "Login",
      register: "Register",
      logout: "Logout",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      full_name: "Full Name",
      phone: "Phone",
      national_id: "National ID",
      email: "Email",
      password: "Password",
      password_requirements: "Password requirements",
      button: {
        loading: "Loading..."
      }
    },
    user: {
      profile: "User Profile",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      created_at: "Created at",
      updated_at: "Updated at",
      edit_profile: "Edit Profile",
      change_password: "Change Password",
      logout: "Logout",
      preferences: "Preferences",
      notifications: "Notifications",
      account_settings: "Account Settings",
      delete_account: "Delete Account",
      confirm_delete: "Confirm Delete",
      user_management: "User Management",
      add_user: "Add User",
      edit_user: "Edit User",
      user_details: "User Details",
      permissions: "Permissions",
      last_login: "Last Login",
      never: "Never"
    },
    users: {
      edit: "edit user",
      title: "Users",
      subtitle: "Manage system users",
      add_user: "Add User",
      edit_user: "Edit User",
      delete_user: "Delete User",
      user_list: "User List",
      user_details: "User Details",
      no_users: "No users found",
      search_placeholder: "Search for a user...",
      filter_by_role: "Filter by role",
      filter_by_status: "Filter by status",
      total_users: "Total Users",
      active_users: "Active Users",
      active: "Active Users",
      inactive: "Inactive Users",
      recent_users: "Recent Users",
      user_created: "User created successfully",
      user_updated: "User updated successfully",
      user_deleted: "User deleted successfully",
      confirm_delete_message: "Are you sure you want to delete this user?",
      bulk_actions: "Bulk Actions",
      select_all: "Select All",
      deselect_all: "Deselect All",
      export_users: "Export Users",
      import_users: "Import Users",
      management: {
        title: "User Management",
        description: "Manage user accounts and their permissions",
        roles: {
          admin: "Administrator",
          user: "User",
          manager: "Manager",
          viewer: "Viewer"
        },
        permissions: {
          read: "Read",
          write: "Write",
          delete: "Delete",
          admin: "Administration"
        },
        actions: {
          activate: "Activate",
          deactivate: "Deactivate",
          reset_password: "Reset Password",
          send_invitation: "Send Invitation",
          revoke_access: "Revoke Access"
        }
      },
      table: {
        name: "Name",
        phone: "Phone",
        national_id: "National ID",
        role: "Role",
        status: "Status",
        actions: "Actions"
      },
      details: {
        login: "Login",
        register: "Register",
        logout: "Logout",
        terms: "Terms of Service",
        privacy: "Privacy Policy"
      },
      details_title: "User Details",
      new: "New User",
      created: "User created",
      updated: "User updated",
      manage_roles: "Manage Roles",
      none_found: "No users found",
      no_results: "No results found"
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome",
      overview: "Overview",
      statistics: "Statistics",
      recent_activity: "Recent Activity",
      quick_actions: "Quick Actions",
      projects_count: "Projects Count",
      materials_count: "Materials Count",
      documents_count: "Documents Count",
      users_count: "Users Count",
      recent_projects: "Recent Projects",
      pending_tasks: "Pending Tasks",
      notifications: "Notifications",
      alerts: "Alerts",
      system_status: "System Status",
      performance: "Performance",
      analytics: "Analytics",
      reports: "Reports",
      export_data: "Export Data",
      refresh: "Refresh",
      loading_dashboard: "Loading dashboard...",
      no_data: "No data available",
      error_loading: "Error loading data",
      active_projects: "Active Projects",
      status_overview: "Status Overview",
      active_projects_label: "active projects",
      total_budget: "Total Budget",
      financial_resources: "Financial Resources",
      team: "Team",
      project_staff: "Project Staff",
      members: "members",
      materials: "Materials",
      available_resources: "Available Resources",
      types: "types",
      project_progress: "Project Progress",
      view_all: "View All",
      no_projects: "No projects",
      distribution_by_region: "Distribution by Region",
      project_distribution: "Project Distribution",
      no_geolocated_projects: "No geolocated projects",
      dev_mode: "Development Mode"
    },
    task: {
      title: "Tasks",
      subtitle: "Assign and track your team's tasks",
      assignments_title: "Task Assignments",
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
      urgent: "Urgent",
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
      next_week: "Next week",
      completion_notes: "Completion notes",
      completion_notes_placeholder: "Add notes about completing this task...",
      mark_completed: "Mark as completed",
      marking_progress: "Marking in progress...",
      completion_success: "Task completed on",
      assignment: "Assignment",
      assignments: "Assignments",
      project: "Project",
      location: "Location",
      completion_date: "Completion date",
      task_details: "Task details",
      optional: "optional",
      task_list: "Task List",
      filter_tasks: "Filter Tasks",
      sort_tasks: "Sort Tasks",
      task_progress: "Task Progress",
      task_comments: "Task Comments",
      add_comment: "Add Comment",
      task_history: "Task History",
      task_files: "Task Files",
      attach_file: "Attach File",
      task_reminders: "Task Reminders",
      set_reminder: "Set Reminder",
      task_dependencies: "Task Dependencies",
      add_dependency: "Add Dependency",
      task_subtasks: "Subtasks",
      add_subtask: "Add Subtask",
      task_time_tracking: "Time Tracking",
      start_timer: "Start Timer",
      stop_timer: "Stop Timer",
      time_spent: "Time Spent",
      estimated_time: "Estimated Time",
      priority_high: "High priority",
      priority_medium: "Medium priority",
      priority_low: "Low priority",
      priority_urgent: "Urgent priority",
      status_in_progress: "In progress",
      status_pending: "Pending",
      status_completed: "Completed",
      status_cancelled: "Cancelled",
      create_sample_data: "Create sample data",
      new: "New Task",
      select_project: "Select a project",
      select_employee: "Select an employee",
      unassigned: "Unassigned",
      due: "Due",
      created: "Created",
      none_found: "No tasks found"
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
        add_title: "Add tender document",
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
        search_placeholder: "Search by name, ID or position...",
        id_label: "ID",
        active: "Active",
        inactive: "Inactive",
        no_employees: "No employees found",
        created_successfully: "Employee created successfully",
        deleted_successfully: "Employee deleted successfully"
      }
    },
    // Add these keys to your translations object for each language

    projects: {
      title: "Projects",
      // ...existing code...
      edit: {
        title: "Edit Project",
        subtitle: "Edit project details",
        location_desc: "Project location details",
        status_desc: "Project status details",
        sync_with_inspection: "Sync with inspection",
        saved: "Project saved",
        saved_desc: "Project saved successfully",
        error: "Error",
        save_error: "Error saving project",
        progress_synced: "Progress synced",
        progress_synced_desc: "Project progress synced with inspection",
        info: "Info",
        no_inspection: "No inspection data",
        not_found: "Project not found",
        load_error: "Error loading project",
        back_to_detail: "Back to project details",
        market_type: "Market Type",
        market_type_placeholder: "Select market type",
        selection_mode: "Selection Mode",
        selection_mode_placeholder: "Select selection mode"
      },
      loading_error: "Error loading projects",
      delete_confirm: "Are you sure you want to delete this project?",
      deleted: "Project deleted",
      deleted_desc: "Project deleted successfully",
      delete_error: "Error deleting project",
      delete_error_desc: "An error occurred while deleting the project.",
      loading_detail: "Loading project details...",
      not_found: "Project not found",
      not_found_desc: "The requested project could not be found.",
      progress_done: "Progress done",
      tab: {
        overview: "Overview",
        materials: "Materials",
        payments: "Payments",
        inspections: "Inspections",
        workflow: "Workflow",
        documents: "Documents",
        takeoffs: "Takeoffs"
      },
      overview: {
        description: "Project overview"
      },
      timeline: "Timeline",
      payments_management: "Payments Management",
      quick_payment_actions: "Quick Payment Actions",
      completed: "Completed",
      expected: "Expected",
      location: "Location",
      empty: "No projects available"
    },
    materials: {
      edit: "Edit Material",
      deleting: "Deleting material...",
      delete: "Delete Material",
      title: "Materials",
      basic_info: "Basic Information",
      name: "Name",
      category: "Category",
      description: "Description",
      unit: "Unit",
      price_per_unit: "Price per Unit",
      available_quantity: "Available Quantity",
      location_info: "Location Information",
      origin_location: "Origin Location",
      coordinates: "Coordinates",
      image: "Image",
      workspace: "Workspace",
      form: {
        name_placeholder: "Material name",
        description_placeholder: "Material description",
        category_placeholder: "Select a category",
        unit_placeholder: "e.g: m², kg, unit",
        price_placeholder: "Unit price",
        quantity_placeholder: "Available quantity",
        location_placeholder: "Origin location",
        select_workspace: "Select a workspace"
      },
      validation: {
        name_required: "Name is required",
        category_required: "Category is required",
        description_required: "Description is required",
        unit_required: "Unit is required",
        price_required: "Price is required",
        quantity_required: "Quantity is required"
      }
    },
    settings: {
      title: "Settings"
    },
    auth: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      full_name: "Full Name",
      phone: "Phone",
      national_id: "National ID",
      email: "Email",
      password: "Password",
      password_requirements: "Password requirements",
      button: {
        loading: "Loading..."
      }
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
      user: "User",
      admin: "Administrator",
      project_manager: "Project Manager",
      supervisor: "Supervisor",
      inspector: "Inspector",
      supplier: "Supplier",
      viewer: "Viewer",
      assigned: "Role assigned",
      assigned_success: "Role assigned successfully",
      assign_error: "Error assigning role",
      removed: "Role removed",
      removed_success: "Role removed successfully",
      remove_error: "Error removing role"
    },
    policy: {
      title: "Privacy Policy",
      last_update: "Last updated: December 15, 2024",
      section1: {
        title: "Information Collection",
        text: "We collect information that you provide to us directly when you register and use our services."
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
        send: "Send Message"
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
        hours_value: "Mon-Fri: 8:00-17:00",
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
        authenticated: "Go to your dashboard",
        unauthenticated: "Create your account to get started",
        dashboard: "Dashboard",
        my_projects: "My Projects",
        start_free: "Start Free",
        login: "Login"
      }
    },
    project_create: {
      title: "Create New Project",
      back_to_projects: "Back to Projects",
      toast: {
        created: "Project Created",
        created_desc: "Project created successfully: ",
        error: "Error",
        error_desc: "An error occurred while creating the project."
      },
      form: {
        title: "Title",
        description: "Description",
        location: "Location",
        status: "Status",
        budget: "Budget",
        start_date: "Start Date",
        end_date: "End Date",
        team_size: "Team Size",
        progress: "Progress",
        financing_source: "Financing Source",
        market_type: "Market Type",
        selection_mode: "Selection Mode",
        project_responsable: "Project Manager",
        main_contractor: "Main Contractor",
        project_reference: "Project Reference",
        allows_initial_payment: "Allow Initial Payment",
        initial_payment_percentage: "Initial Payment Percentage",
        current_phase: "Current Phase",
        current_stage: "Current Stage",
        coordinates: "Coordinates",
        facilities_location: "Facilities Location"
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
      pouvoir_signature: "Signature Authority"
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
