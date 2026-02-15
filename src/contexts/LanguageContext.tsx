import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Language = 'fr' | 'ar' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
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
        common: {
            yes: "Oui",
            no: "Non",
            cancel: "Annuler",
            save: "Enregistrer",
            delete: "Supprimer",
            edit: "Modifier",
            update: "Mettre à jour",
            loading: "Chargement...",
            load_data: "Charger les données",
            error: "Erreur",
            success: "Succès",
            info: "Information",
            back: "Retour",
            search: "Rechercher",
            filter: "Filtrer",
            reset: "Réinitialiser",
            submit: "Soumettre",
            close: "Fermer",
            confirm: "Confirmer",
            optional: "Optionnel",
            required: "Requis",
            refresh: "Actualiser",
            confirm_delete: "Confirmer la suppression"
        },
        supplier_portal: {
            title: "Portail Fournisseur",
            subtitle: "Gérez vos documents, soumissions et demandes de paiement",
            linked_profile: "Profil lié",
            profile_linked_desc: "Votre profil fournisseur a été lié à votre compte.",
            profile_created: "Profil créé",
            profile_created_desc: "Votre profil fournisseur a été créé automatiquement.",
            upload: {
                title: "Téléverser un document",
                placeholder_title: "Titre du document",
                placeholder_description: "Description (optionnelle)",
                upload_button: "Téléverser"
            },
            tabs: {
                shared: "Documents Partagés",
                uploaded: "Mes Documents",
                payments: "Paiements",
                inspections: "Inspections"
            }
        },
        supplier_tender: {
            title: "Portail Fournisseurs - Appels d'Offres",
            subtitle: "Consultez et soumettez des offres",
            access_granted_for: "Accès autorisé pour:",
            tabs: {
                browse: "Parcourir",
                documents: "Documents Partagés",
                submit: "Soumissionner",
                estimate: "Devis"
            },
            empty: {
                no_tenders: "Aucun appel d'offres disponible",
                no_documents: "Aucun document partagé pour le moment",
                select_tender: "Sélectionnez un appel d'offres"
            },
            actions: {
                submit: "Soumissionner",
                download: "Télécharger"
            },
            submit_success: "Soumission envoyée avec succès",
            submit_success_desc: "Votre dossier de candidature a été soumis. Un email de confirmation avec votre code secret vous a été envoyé."
            ,
            project_label: "Projet",
            location_label: "Lieu",
            launched_on: "Lancé le",
            deadline_label: "Limite",
            criteria_intro: "Les appels d'offres sont affichés uniquement s'ils répondent aux critères suivants :",
            criteria: {
                status: "Statut : Publié",
                phase: "Phase : Phase 2 (Appel de soumissions)",
                deadline: "Date limite : Dans le futur"
            },
            documents_shared_for: "Documents partagés pour",
            shared_on: "Partagé le",
            select_tender_prompt: "Sélectionnez un appel d'offres pour préparer votre dossier de candidature.",
            submission_for: "Soumission",
            phase_active: "Phase de soumission active",
            phase_closed: "Phase de soumission fermée",
            submitted_on: "Soumis le",
            status_label: "Statut",
            status_under_review: "En cours d'évaluation",
            document_categories: {
                administrative: "Documents Administratifs",
                technical: "Documents Techniques",
                financial: "Documents Financiers"
            },
            required_documents: {
                administrative: {
                    registre_commerce: "Registre de commerce",
                    statuts_societe: "Statuts de la société",
                    declaration_fiscale: "Déclaration fiscale",
                    certificat_conformite: "Certificat de conformité",
                    attestation_assurance: "Attestation d'assurance"
                },
                technical: {
                    cv_references: "CV et références techniques",
                    certificats_qualification: "Certificats de qualification",
                    plan_realisation: "Plan de réalisation",
                    methodologie: "Méthodologie",
                    planning_previsionnel: "Planning prévisionnel"
                },
                financial: {
                    devis_quantitatif: "Devis quantitatif estimatif",
                    garantie_bancaire: "Garantie bancaire",
                    bilan_financier: "Bilan financier",
                    references_bancaires: "Références bancaires",
                    caution_soumission: "Caution de soumission"
                }
            },
            replace: "Remplacer",
            choose: "Choisir",
            notes_label: "Notes supplémentaires (optionnel)",
            notes_placeholder: "Ajoutez des informations complémentaires...",
            files_selected: "Fichiers sélectionnés",
            dossier_complete: "Dossier complet",
            submitting: "Soumission en cours...",
            submit_button: "Soumettre le dossier",
            browse_button: "Parcourir les appels d'offres",
            estimate_select_prompt: "Choisissez un appel d'offres pour créer votre devis quantitatif estimatif.",
            errors: {
                invalid_deadline: "Date limite de soumission invalide",
                deadline_passed: "La date limite de soumission est dépassée",
                submit_failed: "Erreur lors de la soumission du dossier.",
                already_submitted: "Vous avez déjà soumis un dossier pour cet appel d'offres."
            }
        },
        project: {
            errors: {
                missing_id: "ID du projet manquant",
                not_found: "Projet non trouvé"
            },
            labels: {
                project_manager: "Chef de projet",
                main_contractor: "Contractant principal"
            },
            phase_label: "Phase",
            methodology: {
                standard: "Standard (Cascade)",
                agile: "Agile",
                hybrid: "Hybride"
            }
        },
        app: {
            name: "HadraTech-GPI"
        },
        locale: "Langue",
        currency: {
            mru: "MRU"
        },
        nav: {
            employees : "Employées",
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
            },
            supplier_portal: "Portail Fournisseur",
            supplier_tender_portal: "Portail Fournisseur/soumissionaire",
            supplier_dashboard: "Tableau Fournisseur",
            supplier_access: "Accès Fournisseur",
            evaluation_access: "Accès Évaluation",
            access_secure: "Accès Sécurisé",
            suppliers: "Fournisseurs"

        },
        role_based_route: {
            loading: "Chargement...",
            denied_title: "Accès refusé",
            denied_desc: "Vous n’avez pas les permissions nécessaires pour accéder à cette page.",
            required_roles: "Rôles requis",
            back: "Retour"
        },
        supplier_dashboard: {
            title: "Tableau de bord fournisseur",
            subtitle: "Suivez vos notifications, paiements et documents.",
            stats: {
                total_payments: "Paiements totaux",
                transactions: "transactions",
                pending_payments: "Paiements en attente",
                processing: "En traitement",
                notifications: "Notifications",
                unread: "non lues",
                documents: "Documents",
                available: "disponibles"
            },
            tabs: {
                notifications: "Notifications",
                payments: "Paiements",
                documents: "Documents"
            },
            notifications: {
                title: "Notifications",
                unknown_date: "Date inconnue",
                new: "Nouveau",
                empty: "Aucune notification.",
                types: {
                    task_assignment: "Affectation de tâche",
                    task_notification: "Notification de tâche",
                    task_comment: "Commentaire de tâche",
                    task_completed: "Tâche terminée",
                    password_reset: "Réinitialisation du mot de passe"
                }
            },
            payments: {
                title: "Paiements",
                payment: "Paiement",
                amount: "Montant",
                unknown_date: "Date inconnue",
                paid: "Payé",
                pending: "En attente",
                empty: "Aucun paiement."
            },
            documents: {
                title: "Documents",
                unknown_date: "Date inconnue",
                empty: "Aucun document."
            }
        },
        tenders: {
            supplierSecure: {
                title: "Accès Sécurisé Fournisseur",
                description: "Entrez votre code de partage pour accéder aux documents de l'appel d'offres",
                input_placeholder: "CODE-DE-PARTAGE",
                format_note: "Format: 12 caractères alphanumériques",
                validate_button: "Accéder aux documents",
                validating: "Validation...",
                access_granted: "Accès autorisé",
                access_denied: "Accès refusé",
                invalid_code_desc: "Veuillez entrer un code valide",
                validate_error_desc: "Erreur lors de la validation du code",
                security_title: "Sécurité et confidentialité",
                security_items: {
                    secure_connection: "Connexion sécurisée et chiffrée",
                    audit_logs: "Tous les accès sont enregistrés",
                    compliant: "Conforme aux normes mauritaniennes"
                },
                documents: {
                    title: "Documents accessibles",
                    description: "Documents partagés pour cette soumission",
                    none: "Aucun document disponible",
                    download: "Télécharger"
                },
                disconnect: "Déconnexion",
                warning: {
                    title: "Rappel important",
                    text: "Les documents accessibles via ce code sont strictement confidentiels. Toute utilisation non autorisée ou partage avec des tiers est interdit et peut entraîner des sanctions selon le code des marchés publics mauritanien."
                }
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
            total: "Nombre total d'utilisateurs",
            cancel: "Annuler",
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
            no_name: "Utilisateur sans nom",
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
            management_title: "Tableau de Bord Gestion",
            management_subtitle: "Centre de contrôle pour gestionnaires de projets",
            checking_permissions: "Vérification des permissions...",
            access_denied_title: "Accès Refusé",
            access_restricted: "Ce tableau de bord est réservé aux gestionnaires de projets, administrateurs et directeurs.",
            your_roles: "Vos rôles actuels",
            required_roles_label: "Rôles requis",
            no_role_assigned: "Aucun rôle assigné",
            back_to_projects: "Retour aux Projets",
            management_tabs: {
                actions: "Actions Management",
                overview: "Vue d'ensemble",
                monitoring: "Monitoring",
                    alerts: {
                        total: "Total Alerts",
                        critical: "Critical",
                        high: "High",
                        medium: "Medium",
                        low: "Low",
                        tabs: {
                            all: "All",
                            delay: "Delays",
                            payment: "Payments",
                            inspection: "Inspections",
                            guarantee: "Guarantees"
                        },
                        delay_title: "Project Delay",
                        delay_desc_prefix: "Delay of",
                        delay_desc_suffix: "detected",
                        payment_blocked: "Payment Blocked",
                        payment_blocked_desc_prefix: "Payment of",
                        payment_blocked_desc_suffix: "blocked",
                        validation_required: "Validation required",
                        inspection_overdue: "Inspection Overdue",
                        inspection_overdue_desc_prefix: "Inspection not completed for",
                        days: "days",
                        none: "No alerts found",
                        acknowledge: "Acknowledge",
                        guarantee_expiring: "Expiring Bank Guarantee",
                        guarantee_expiring_desc_prefix: "Guarantee of",
                        guarantee_expiring_desc_suffix: "will expire in",
                        load_error: "Failed to load alerts",
                        acknowledge_success: "Alert acknowledged",
                        acknowledge_description: "The alert has been marked as acknowledged",
                        project_label: "Project"
                    },
            },
            cards: {
                active_projects: "Projets Actifs",
                in_progress_description: "En cours de réalisation",
                projects_label: "projets",
                total_budget: "Budget Total",
                financial_resources: "Ressources financières",
                teams: "Équipes",
                staff_assigned: "Personnel affecté",
                members_label: "membres",
                materials_title: "Matériaux",
                available_resources: "Ressources disponibles",
                types_label: "types",
                project_progress: "Progression des Projets",
                recent_projects: "Projets Récents"
            },
            badges: {
                roles_label: "Rôles",
                administrator: "Administrateur",
                director: "Directeur",
                project_manager: "Chef de Projet"
            },
            monitoring: {
                http_status: "Statut HTTP",
                active: "Actif",
                real_time_monitoring: "Surveillance en temps réel",
                critical: "Critique",
                degraded: "Dégradé",
                total_requests: "Requêtes totales",
                error_rate: "Taux d'erreur",
                recent_errors: "Erreurs récentes",
                success_rate: "Taux de succès",
                avg_response_time: "Temps de réponse moyen",
                recent_errors_desc: "Dernières erreurs HTTP détectées dans l'application",
                no_recent_errors: "Aucune erreur récente",
                error_alert_message: "Taux d'erreur élevé détecté. Vérifiez la connectivité réseau et l'état des services.",
                status_success: "Succès",
                status_redirect: "Redirection",
                status_client_error: "Erreur Client",
                status_server_error: "Erreur Serveur",
                guarantees: "Garanties Bancaires",
                alerts_count: "Alertes",
                expiring_soon: "Garanties expirant bientôt",
                payment_control: "Contrôle Paiements",
                automatic_validation: "Validation automatique",
                inspections: "Inspections",
                overdue: "En Retard",
                overdue_inspections: "Inspections en retard"
            },
            loading: "Loading...",
            loading_dashboard: "Chargement du tableau de bord...",
            loading_stats: "Chargement des statistiques...",
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
                alerts: {
                        total: "Total Alertes",
                        critical: "Critique",
                        high: "Élevée",
                        medium: "Moyenne",
                        low: "Faible",
                        tabs: {
                            all: "Toutes",
                            delay: "Retards",
                            payment: "Paiements",
                            inspection: "Inspections",
                            guarantee: "Garanties"
                        },
                        delay_title: "Retard Projet",
                        delay_desc_prefix: "Retard de",
                        delay_desc_suffix: "détecté",
                        payment_blocked: "Paiement Bloqué",
                        payment_blocked_desc_prefix: "Paiement de",
                        payment_blocked_desc_suffix: "bloqué",
                        validation_required: "Validation requise",
                        inspection_overdue: "Inspection en retard",
                        inspection_overdue_desc_prefix: "Inspection non complétée pour",
                        days: "jours",
                        guarantee_expiring: "Garantie Bancaire expirante",
                        guarantee_expiring_desc_prefix: "Garantie de",
                        guarantee_expiring_desc_suffix: "va expirer dans",
                        load_error: "Impossible de charger les alertes",
                        acknowledge: "Acquitter",
                        acknowledge_success: "Alerte acquittée",
                        acknowledge_description: "L'alerte a été marquée comme acquittée",
                        none: "Aucune alerte trouvée",
                        project_label: "Projet"
                    },
            start_label: "Début",
            end_label: "Fin",
            dev_mode: "Mode développement",
            view_all: "Voir tout",
            distribution_by_region: "Distribution par région",
            project_distribution: "Distribution des projets",
            no_geolocated_projects: "Aucun projet géolocalisé",
            map_no_data: "Aucune donnée géographique à afficher",
            legend_title: "Légende",
            materials_label: "Matériaux"
        },
        management_actions: {
            loading: "Chargement...",
            error_title: "Erreur",
            error_loading: "Impossible de charger les actions",
            critical_actions: "Actions Critiques",
            critical_attention: "Nécessitent une attention immédiate",
            validations_pending: "Validations en Attente",
            pending_validation: "En attente de validation",
            urgent_tasks: "Tâches Urgentes",
            to_do_quickly: "À réaliser rapidement",
            decisions_required: "Décisions Requises",
            managerial_decisions: "Décisions managériales",
            priority_actions: "Actions Prioritaires",
            priority_description: "Actions nécessitant une intervention managériale immédiate",
            validation_payment_inspection: "Validation Paiement - Inspection",
            inspection_at: "Inspection à",
            payment_request: "Demande de Paiement",
            amount: "Montant",
            missed_inspection: "Inspection Manquée",
            days_overdue: "jours de retard",
            inspector: "Inspecteur",
            budget_review: "Révision Budget",
            project_at: "Projet à",
            budget_check_needed: "vérification budget nécessaire",
            team_assignment: "Affectation Équipe",
            new_project_starting: "Nouveau projet démarrant - affecter équipe d'ingénieurs",
            category_validation: "Validation",
            category_task: "Tâche",
            category_review: "Révision",
            category_decision: "Décision",
            category_action: "Action",
            project: "Projet",
            deadline: "Échéance",
            link: "Lien",
            process: "Traiter",
            payment_control: "Contrôle Paiements",
            payment_control_desc: "Valider et débloquer les paiements",
            access_control: "Accéder au Contrôle",
            guarantee_monitoring: "Surveillance Garanties",
            guarantee_monitoring_desc: "Suivre les garanties bancaires",
            monitor_guarantees: "Surveiller Garanties",
            inspection_tracking: "Suivi Inspections",
            inspection_tracking_desc: "Monitoring des inspections",
            track_inspections: "Suivi Inspections"
        },
        bank_guarantee: {
            title: "Surveillance Garanties Bancaires",
            subtitle: "Système automatisé de détection des retards et déclenchement des garanties bancaires",
            active_alerts: "Alerte(s) Active(s)",
            manager_alerts: "Alertes du Gestionnaire de Projet",
            severity: "Sévérité",
            type: "Type",
            acknowledge: "Acquitter",
            acknowledged_note: "Pris en compte depuis le monitoring",
            loading_project: "Chargement du projet et de l'organisation..."
            ,
            load_delays_error: "Impossible de charger les retards de projet",
            not_found_for_project: "Aucune garantie bancaire trouvée pour ce projet",
            bank_notified_prefix: "La banque a été notifiée du retard sur",
            internal_notifications_sent: "notifications internes envoyées",
            notification_send_failed: "Échec de l'envoi de la notification bancaire",
            project_not_found: "Projet introuvable",
            critical_projects: "projet(s) en retard critique",
            critical_alerts_desc: "Des retards dépassent les seuils contractuels. Action immédiate requise.",
            no_critical_delays_title: "Aucun retard critique détecté",
            no_critical_delays_desc: "Tous les projets respectent les délais contractuels.",
            notify_sending: "Envoi...",
            notify_bank: "Notifier Banque",
            view_project: "Voir Projet",
            delay_label: "Retard",
            days_label: "jours",
            contractor_label: "Entrepreneur",
            planned_date_label: "Date prévue",
            milestones_missed_label: "Jalons manqués",
            escalation_thresholds_title: "Seuils d'Escalade",
            delay_percentage_suffix: "de retard",
            severity_labels: {
                delay_alert: "Alerte Retard",
                bank_notification: "Notification Bancaire",
                guarantee_trigger: "Déclenchement Garantie"
            },
            escalation: {
                legal: "Escalade Juridique"
            },
            actions: {
                task_assignment_title: "Gestion retard projet",
                task_assignment_msg_prefix: "Veuillez traiter le retard de",
                hierarchy_notification_title: "Alerte retard critique",
                hierarchy_notification_msg_prefix: "Le projet",
                sms_title: "SMS retard projet",
                sms_msg_prefix: "SMS: Retard",
                call_title: "Appel retard projet",
                call_msg_prefix: "Appel concernant le retard du projet",
                email_title: "Email retard projet",
                email_msg_prefix: "Email concernant le retard du projet",
                mail_title: "Courrier retard projet",
                mail_msg_prefix: "Courrier concernant le retard du projet"
            },
            unknown_action_type: "Type d'action non reconnu",
            action_created_success: "{title} créée avec succès",
        },
        insurance_management: {
            title: "Gestion des Assurances",
            subtitle: "Surveillance automatisée des certificats d'assurance et alertes d'expiration",
            active_alerts: "Alerte(s) Active(s)",
            manager_alerts: "Alertes d'Assurance du Gestionnaire de Projet",
            severity: "Sévérité",
            type: "Type",
            detected_on: "Détecté le",
            process: "Traiter",
            processed_note: "Traité depuis la gestion des assurances",
            loading_project: "Chargement du projet et de l'organisation..."
        },
        notifications_center: {
            title: "Centre de Notifications",
            subtitle: "Système de notifications centralisé avec gestion des alertes et notifications par rôle",
            unread: "non lues",
            mark_all_read: "Marquer tout lu",
            refresh: "Actualiser",
            mark_all_success: "Toutes les notifications ont été marquées comme lues",
            load_error: "Impossible de charger les notifications",
            mark_error: "Impossible de marquer les notifications comme lues",
            search_placeholder: "Rechercher dans les notifications...",
            filters: "Filtres",
            stats: {
                total: "Total",
                unread: "Non lues",
                urgent: "Urgentes",
                inspections: "Inspections",
                projects: "Projets",
                payments: "Paiements",
                tasks: "Tâches",
                documents: "Documents",
                system: "Système"
            },
            tabs: {
                all: "Toutes",
                role_based: "Par Rôle",
                inspections: "Inspections",
                projects: "Projets",
                payments: "Paiements",
                tasks: "Tâches",
                documents: "Documents",
                system: "Système",
                management: "Gestion"
            },
            role_based_description: "Notifications filtrées selon votre rôle et vos responsabilités dans le système",
            no_notifications: "Aucune notification"
        },
        payment_control: {
            title: "Contrôle des Paiements",
            subtitle: "Gestion et validation des paiements avec notifications en temps réel",
            notifications_label: "Notifications",
            recent_notifications: "Notifications de Paiement Récentes",
            new: "nouveau(x)",
            no_recent: "Aucune notification de paiement récente",
            no_pending: "Aucun paiement en attente de validation",
            access_restricted: "Accès restreint. Vous n'avez pas les permissions nécessaires pour accéder au contrôle des paiements.",
            load_error: "Impossible de charger les notifications de paiement",
            loading_project: "Chargement du projet et de l'organisation..."
        },

        task: {
            edit: "Modifier la tâche",
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
                deleted_successfully: "Employé supprimé avec succès",
                subtitle :"Gérer les employés et leur hiérarchie organisationnelle",
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
                deleted_successfully: "Employé supprimé avec succès",
                subtitle :"Liste Employeé"
            }
        },
        projects: {
            header: {
                title: "Projets",
                subtitle: "Gérez et suivez tous vos projets de construction",
                new_project: "Nouveau Projet",
                import_export: "Import/Export"
            },
            empty_state: {
                title: "Aucun projet trouvé",
                description: "Modifiez vos critères de recherche ou créez un nouveau projet.",
                create_button: "Créer un nouveau projet"
            },
            delete: "Supprimer",
            payments_management: "Gestion des paiements",
            quick_payment_actions: "Actions de paiement rapides",
            progress_done: "Progression terminée",
            overview: {
                description: "Description du projet"
            },
            timeline: "Chronologie",
            start_date: "Date de début",
            started: "Commencé",
            end_date_expected: "Date de fin prévue",
            expected: "Prévu"
            ,
            progress: {
                percentage: "Pourcentage"
            },
            title: "Projets",
            all_desc: "tous les projects",
            new: "nouveau ",
            add: "Ajouter",
            new_desc: "Créer un nouveau projet",
            all: "tous",
            tab: {
                overview: "Vue d'ensemble",
                materials: "Matériaux",
                payments: "Paiements",
                supplier_portal: "Supplier Portal",
                supplier_tender_portal: "Supplier Tender Portal",
                supplier_access: "Supplier Document Access",
                evaluation_access: "Evaluation Access",
                access_secure: "Secure Access",
                access_evaluation: "Evaluation Access",
                inspections: "Inspections",
                workflow: "Flux de travail",
                documents: "Documents",
                login: "Log In",
                takeoffs: "Métrés"
            },
            takeoffs: {
                form: {
                    basic_info: "Informations de base",
                    advanced: "Calcul avancé"
                }
                ,
                elements: {
                    measured: "Éléments mesurés"
                },
                total: {
                    value: "Valeur totale",
                    quantity: "Quantité totale"
                },
            }
            ,
            project: {
                cancel: "Annuler"
            },
            edit: {
                title: "Modifier le projet",
                subtitle: "Modifier les détails du projet",
                location_desc: "Détails de l'emplacement du projet",
                status_desc: "Détails du statut du projet",
                sync_with_inspection: "Synchroniser avec l'inspection",
                saved: "Projet enregistré",
                saved_desc: "Projet enregistré avec succès",
                error: "Erreur",
                save_error: "Erreur lors de l'enregistrement du projet",
                progress_synced: "Progression synchronisée",
                progress_synced_desc: "Progression du projet synchronisée avec l'inspection",
                info: "Info",
                no_inspection: "Aucune donnée d'inspection",
                not_found: "Projet non trouvé",
                load_error: "Erreur lors du chargement du projet",
                back_to_detail: "Retour aux détails du projet",
                market_type: "Type de marché",
                market_type_placeholder: "Sélectionner le type de marché",
                selection_mode: "Mode de sélection",
                selection_mode_placeholder: "Sélectionner le mode de sélection",
                title_placeholder: "Enter project title",
                location_placeholder: "Select location",
                status_placeholder: "Select status",
                progress_desc: "Specify project progress as a percentage.",
                progress_current: "Current progress: {value}%",
                description_placeholder: "Describe the project..."
            },
            loading_error: "Erreur lors du chargement des projets",
            delete_confirm: "Êtes-vous sûr de vouloir supprimer ce projet ?",
            deleted: "Projet supprimé",
            deleted_desc: "Projet supprimé avec succès",
            delete_error: "Erreur lors de la suppression du projet",
            delete_error_desc: "Une erreur est survenue lors de la suppression du projet.",
            loading_detail: "Chargement des détails du projet...",
            not_found: "Projet non trouvé",
            not_found_desc: "Le projet demandé est introuvable.",

            completed: "Terminé",
            location: "Localisation",
            empty: "Aucun projet disponible",
            importExport: {
                title: 'Import/Export de Projets',
                description: 'Importez ou exportez vos projets dans différents formats',
                fileImport: 'Import de fichiers',
                predefinedProjects: 'Projets prédéfinis',
                export: 'Export',
                predefined2025: 'Projets prédéfinis 2025',
                predefinedDescription: 'Importez des projets prédéfinis avec des données réalistes pour la Mauritanie',
                includedProjects: 'Projets inclus',
                infrastructureProjects: 'Projets d\'infrastructure avec budgets réalistes',
                diverseFunding: 'Diversité des sources de financement',
                variedMarkets: 'Types de marchés variés (public, privé, PPP)',
                timeline2025: 'Chronologie 2025-2027',
            },
            import: {
                fileImport: 'Import de projets par fichier',
                fileImportDescription: 'Importez vos projets depuis un fichier Excel, JSON ou CSV',
                importantInfo: 'Informations importantes',
                supportedFormats: 'Formats supportés',
                maxSize: 'Taille maximale',
                requiredColumns: 'Colonnes requises',
                optionalColumns: 'Colonnes optionnelles',
                selectFile: 'Sélectionnez un fichier ou glissez-le ici',
                downloadTemplate: 'Télécharger un modèle',
                importing: 'Import en cours',
                importProjects: 'Importer les projets',
                success: 'Import réussi',
                error: 'Erreur d\'import',
                invalidFile: 'Fichier invalide',
                fileTooLarge: 'Le fichier est trop volumineux. Taille maximale autorisée:',
                unsupportedFormat: 'Format de fichier non supporté. Formats autorisés: Excel (.xlsx, .xls), JSON (.json), CSV (.csv)',
                excelReadError: 'Erreur lors de la lecture du fichier Excel',
                fileReadError: 'Erreur lors de la lecture du fichier',
                invalidJson: 'Fichier JSON invalide',
                csvReadError: 'Erreur lors de la lecture du fichier CSV',
                noData: 'Aucune donnée trouvée dans le fichier',
                line: 'Ligne',
                projectsImported: 'projet(s) importé(s) avec succès',
                errors: 'erreur(s)',
                detailedErrors: 'Erreurs détaillées',
                defaultTitle: 'Projet importé',
                exampleProject: 'Exemple Projet 1',
                exampleDescription: 'Description du projet exemple',
            },
            export: {
                title: 'Export des projets',
                description: 'Exportez tous vos projets dans le format de votre choix',
                selectFormat: 'Choisissez le format d\'export',
                jsonDesc: 'Format structuré',
                excelDesc: 'Feuille de calcul',
                csvDesc: 'Valeurs séparées',
                exportAs: 'Exporter au format',
                exporting: 'Export en cours',
                success: 'Export réussi',
                error: 'Erreur d\'export',
                errorDescription: 'Une erreur est survenue lors de l\'export des projets',
                noProjects: 'Aucun projet à exporter',
                noProjectsDescription: 'Aucun projet n\'est disponible pour l\'export',
                noSelection: 'Aucun projet sélectionné',
                noSelectionDescription: 'Veuillez sélectionner au moins un projet à exporter',
                projectsExported: 'projet(s) exporté(s) au format',
                available: 'disponible(s)',
                total: 'Total',
                selected: 'Sélectionné(s)',
                availableFormats: 'Formats d\'export disponibles',
                createFirst: 'Aucun projet n\'est disponible pour l\'export. Créez d\'abord quelques projets',
                searchPlaceholder: 'Rechercher un projet...',
                selectAll: 'Tout sélectionner',
                clearSelection: 'Désélectionner tout',
                noResults: 'Aucun projet trouvé',
            },
        },
        materials: {
            estimated_duration: "Durée estimée",
            back_to_list: "Retour à la liste",
            edit: "Modifier,",
            edit_details: "Modifier les détails",
            cancel: "Annuler",
            save_changes: "Enregistrer les modifications",
            name_placeholder: "Entrez le nom du matériel",
            description_placeholder: "Entrez la description",
            quantities_pricing: "Quantités et tarification",
            quantity: "Quantité",
            min_quantity: "Quantité minimale",
            timeline: "Chronologie",
            start_date: "Date de début",
            end_date: "Date de fin",
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
            },
            supplier_info: {
                title: "Informations sur le fournisseur",
                description: "Détails et contacts des fournisseurs locaux de matériaux pour soutenir vos projets de construction.",
            },
            documents: {
                title: "Documents du matériau",
                subtitle: "Gestion de tous les documents du matériau (factures, certificats, manuel d'utilisation)",
                upload: "Téléverser un document",
                download: "Télécharger",
                delete: "Supprimer",
                edit: "Modifier",
                no_documents: "Aucun document",
                upload_success: "Document téléversé avec succès",
                upload_error: "Erreur de téléversement",
                delete_success: "Document supprimé avec succès",
                delete_error: "Erreur de suppression",
                delete_confirm: "Êtes-vous sûr de vouloir supprimer ce document ?",
                file_name: "Nom du fichier",
                file_size: "Taille du fichier",
                file_type: "Type de fichier",
                uploaded_by: "Téléversé par",
                uploaded_at: "Date de téléversement",
                description: "Description",
                add_document: "Ajouter un document",
                document_type: "Type de document",
                select_file: "Sélectionner un fichier",
                drag_drop: "Glissez-déposez vos fichiers ici ou cliquez pour sélectionner",
                document_upload_info: "Téléversement de documents pour le matériau (factures, certificats, manuel d'utilisation, etc)",
                document_save_later: "Les documents seront sauvegardés après la création du matériau",
                upload_title: "Téléversement de documents",
                upload_description: "Téléversez les documents qui seront associés à ce matériau",
                types_title: "Types de documents pris en charge :",
                types: {
                    invoice: "Facture",
                    delivery_note: "Bon de livraison",
                    warranty: "Garantie",
                    certificate: "Certificat",
                    manual: "Manuel",
                    photo: "Photo",
                    contract: "Contrat",
                    report: "Rapport",
                    other: "Autre"
                },
                invoice_desc: "Preuves d'achat et de livraison",
                certificate_desc: "Qualité, conformité, sécurité",
                manual_desc: "Instructions d'utilisation",
                warranty_desc: "Documents de garantie",
                save_reminder_title: "Sauvegarde automatique",
                save_reminder_text: "Les documents seront automatiquement associés au matériau après sa création."
            },
            warehouse_location: "Emplacement d'entrepôt et géolocalisation",
        },
        project_import: {
            title: "Import de projet",
            desc: "Importer des projets depuis un fichier Excel"
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
            about_desc: "Notre système de gestion ,HadraTech-GPI, ERP est conçu pour simplifier et optimiser tous les aspects de vos projets de construction.",
            rights: "Tous droits réservés",
            by_hadratech: "Développé par HadraTech",
            quick_links: "Liens rapides",
            legal: "Légal",
            newsletter: "Newsletter"
        },
        notfound: {
            message: "Page non trouvée",
            return_home: "Retour à l'accueil"
        },
        inspection: {
            common: {
                back: "Retour",
                loading: "Chargement...",
                save: "Enregistrer",
                saving: "Enregistrement...",
                cancel: "Annuler",
                error: "Erreur",
                success: "Succès",
                not_found: "Inspection non trouvée",
                load_error: "Impossible de charger l'inspection",
                update_success: "Inspection mise à jour avec succès",
                update_error: "Impossible de mettre à jour l'inspection",
                required_fields: "Veuillez remplir tous les champs obligatoires",
                inspector_required: "Inspecteur *",
                inspector_placeholder: "Nom de l'inspecteur",
                date_label: "Date d'inspection *",
                status_label: "Statut",
                progress_label: "Progression (%)",
                comments_label: "Commentaires",
                comments_placeholder: "Vos commentaires...",
                project_label: "Projet"
            },
            status: {
                scheduled: "Programmée",
                in_progress: "En cours",
                approved: "Approuvée",
                rejected: "Rejetée",
                requires_changes: "Modifications requises"
            },
            edit: {
                title: "Modifier l'inspection",
                description: "Modification de l'inspection pour le projet",
                in_development: "En développement"
            },
            create: {
                title: "Créer une inspection",
                description: "Créer une nouvelle inspection pour le projet",
                in_development: "En développement"
            },
            dialog: {
                new_inspection: "Créer une inspection",
                title: "Inspection de chantier",
                description: "Créer une nouvelle inspection pour le projet",
                date: "Date de l'inspection",
                select_date: "Sélectionner une date",
                inspector: "Inspecteur",
                inspector_placeholder: "Nom de l'inspecteur",
                status: "Statut de l'inspection",
                select_status: "Sélectionner un statut",
                status_pending: "En attente",
                status_approved: "Approuvé",
                status_requires_changes: "Nécessite des modifications",
                status_rejected: "Rejeté",
                progress: "Avancement (%)",
                comments: "Commentaires",
                comments_placeholder: "Saisir vos remarques",
                cancel: "Annuler",
                create: "Créer",
                creating: "Création...",
                created: "Inspection enregistrée",
                created_description: "L'inspection a bien été ajoutée.",
                error: "Erreur",
                error_description: "Une erreur est survenue lors de la création de l'inspection.",
                validation_error: "Champs obligatoires",
                validation_inspector: "Le nom de l'inspecteur est requis",
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
        profile: {
            title: "Profil",
            user_id_label: "ID Utilisateur",
            account_security: "Sécurité du compte",
            change_password: "Changer le mot de passe",
            change_password_description: "Modifiez votre mot de passe pour sécuriser votre compte.",
            new_password: "Nouveau mot de passe",
            new_password_placeholder: "Entrez votre nouveau mot de passe",
            confirm_password: "Confirmer le nouveau mot de passe",
            confirm_password_placeholder: "Confirmez votre nouveau mot de passe",
            password_mismatch: "Les nouveaux mots de passe ne correspondent pas.",
            password_length_error: "Le mot de passe doit contenir au moins 6 caractères.",
            password_updated: "Mot de passe mis à jour avec succès",
            update_password: "Mettre à jour le mot de passe",
            updating: "Mise à jour..."
        },
        reset_password: {
            title: "Nouveau mot de passe",
            invalid_link: "Lien invalide",
            checking_link: "Vérification du lien...",
            invalid_expired: "Ce lien de réinitialisation est invalide ou a expiré.",
            back_to_login: "Retour à la connexion",
            update_button: "Mettre à jour le mot de passe",
            password_mismatch: "Les mots de passe ne correspondent pas.",
            password_length_error: "Le mot de passe doit contenir au moins 6 caractères.",
            update_error: "Erreur lors de la mise à jour du mot de passe.",
            invalid_link_error: "Lien de réinitialisation invalide ou expiré."
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
        terms: {
            title: "Conditions d'utilisation",
            last_update: "Dernière mise à jour : 21 juillet 2025",
            section1: {
                title: "1. Acceptation des conditions",
                text: "En accédant ou en utilisant notre logiciel, que ce soit en mode SaaS ou sur site, vous acceptez d'être lié par ces conditions d'utilisation."
            },
            section2: {
                title: "2. Utilisation du service SaaS",
                text: "Notre plateforme SaaS est hébergée dans le cloud et accessible via internet. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités sous votre compte."
            },
            section3: {
                title: "3. Déploiement sur site",
                text: "Si vous déployez notre logiciel sur votre propre infrastructure (sur site), vous acceptez de respecter toutes les consignes d'installation, de maintenance et de sécurité fournies par HadraTech. HadraTech n'est pas responsable des problèmes liés à votre environnement ou mauvaise utilisation."
            },
            section4: {
                title: "4. Hébergement cloud",
                text: "Pour les utilisateurs SaaS, notre logiciel est hébergé sur une infrastructure cloud sécurisée. Nous utilisons des pratiques de sécurité conformes aux standards industriels, mais aucun système n'est totalement sécurisé."
            },
            section5: {
                title: "5. Octroi de licence",
                text: "HadraTech vous accorde une licence non exclusive et non transférable pour utiliser le logiciel conformément aux termes de votre abonnement ou contrat de licence. Vous ne pouvez pas sous-licencier, louer ou prêter le logiciel."
            },
            section6: {
                title: "6. Restrictions",
                text: "Vous ne pouvez pas : décompiler, désassembler, modifier ou créer des œuvres dérivées du logiciel sauf si la loi l'autorise expressément ou avec le consentement écrit de HadraTech."
            },
            section7: {
                title: "7. Paiement et frais",
                text: "L'utilisation du service SaaS est soumise au paiement des frais d'abonnement applicables. Les licences sur site peuvent nécessiter un paiement unique ou récurrent selon votre contrat de licence."
            },
            section8: {
                title: "8. Résiliation",
                text: "HadraTech peut suspendre ou résilier votre accès en cas de violation de ces conditions. Après résiliation, votre licence prend fin et vous devez cesser toute utilisation."
            },
            section9: {
                title: "9. Limitation de responsabilité",
                text: "HadraTech ne peut être tenu responsable des dommages indirects ou consécutifs résultant de l'utilisation ou de l'incapacité à utiliser le logiciel."
            },
            section10: {
                title: "10. Droit applicable",
                text: "Ces conditions sont régies par les lois de la juridiction où HadraTech est enregistrée."
            },
            rights: "Tous droits réservés",
            by_hadratech: "Développé par HadraTech",
            about_desc: "Notre système ERP de gestion de construction est conçu pour simplifier et optimiser tous les aspects de vos projets de construction."

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
                    description: "Gérez vos projets de construction :: Suivi du cycle de vie complet avec phases, jalons et progression"
                },
                materials: {
                    title: "Matériaux",
                    description: "Gestion des matériaux : Inventaire, approvisionnement et suivi de la disponibilité"
                },
                documents: {
                    title: "Documents, Gestion des appels d'offres",
                    description: "Gestion documentaire : Téléversement de fichiers, catégorisation et gestion des workflows"
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
                title: "Fonctionnalités principales",
                description: "Découvrez nos outils de gestion",
                discover: "Découvrir",
                login_to_access: "Se connecter pour accéder",
                register: "Créer un compte",
                powered: "Plateforme complète, Propulsé par HadraTech",
                management: "GESTION DE MATÉRIAUX, SUIVI DES PROJETS",
                system: "Système  de suivi des projets et Gestion des Matériaux",
                message: "Valoriser le patrimoine avec les matériaux locaux",
                details: "Suivez vos projets de construction utilisant la pierre d'Atar/aioun, coquillage/nouakchott et l'argile mauritanienne. Notre solution optimise la gestion des projets de construction, nottament avec des matériaux locaux et préserve les techniques traditionnelles."
            },
            stats: {
                projects: "Projets",
                regions: "Régions",
                satisfaction: "Satisfaction"
            },// Pour la Direction/Planification
        direction_features: {
            title: "Tableaux de Bord Stratégiques",
            description: "Pilotage des investissements et planification énergétique",
            powered: "Gestion de Projet Intégré, Propulsé par HadraTech",
            system: "Système de supervision et aide à la décision",
            details: "Visualisez en temps réel les indicateurs de performance, planifiez les investissements d'infrastructure et optimisez la répartition des ressources énergétiques sur le territoire national.",
            management : "Gestion des Actifs et Maintenance Préventive",
    message:"Suivi et optimisation des infrastructures énergétiques",},

// Pour les Bureaux d'Études
    consulting_features: {
            title: "Ingénierie et Études de Projets",
            description: "Conception et simulation de réseaux électriques",
            system: "Plateforme de modélisation et dimensionnement",
            details: "Étudiez la faisabilité technique des projets, dimensionnez les réseaux de distribution et simulez l'impact des nouvelles infrastructures énergétiques."
        ,message: "Optimisation des réseaux pour une distribution efficace de l'énergie",
    management : "Gestion des Projets d'Ingénierie",
    powered : "Gestion de Projet Intégré, Propulsé par HadraTech",

        },

        // Pour l'Approvisionnement
        procurement_features: {
            title: "Gestion de la Chaîne Logistique",
            description: "Optimisation des achats et stocks énergétiques",
            system: "Système de traçabilité des équipements",
            details: "Gérez les appels d'offres, suivez les commandes de transformateurs, câbles et compteurs, et optimisez les niveaux de stock pour garantir la continuité du service."
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
                started: "Commencé",
                end_date_expected: "Date de fin prévue",
                delete: "Supprimer",
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
                facilities_location: "Localisation des installations",
                title_placeholder: "Enter project title",
                location_placeholder: "Select location",
                status_placeholder: "Select status",
                progress_desc: "Specify project progress as a percentage.",
                progress_current: "Current progress: {value}%",
                description_placeholder: "Describe the project..."
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
            // Administrative subcategories
            lettre_soumission: "Lettre de soumission",
            pouvoir_signature: "Pouvoir de signature",
            acte_groupement: "Acte de groupement",
            attestation_impot: "Attestation d'impôt",
            attestation_cnss: "Attestation CNSS",
            attestation_non_faillite: "Attestation non faillite",
            renseignement_soumissionnaire: "Renseignement sur le soumissionnaire",
            // Planification (PAA) - Administrative
            plan_annuel_achats: "Plan Annuel d'Achats (PAA)",
            modele_paa: "Modèle de Plan Annuel des Achats",
            validation_ordonnateur: "Validation par l'Ordonnateur",
            publication_armp: "Publication sur le site ARMP",
            // Initiation - Administrative
            demande_initiation: "Demande d'Initiation d'une Procédure",
            procedure_proposee: "Procédure proposée",
            // Sélection - Administrative
            consultation_directe: "Consultation Directe (≤ 600 000 MRU)",
            consultation_concurrentielle: "Consultation Concurrentielle",
            lettre_consultation: "Lettre de consultation (Pièce N°1)",
            modele_soumission: "Modèle de soumission (Pièce N°2)",
            modele_contrat: "Modèle de contrat (Pièce N°4)",
            registre_reception_plis: "Registre de Réception des Plis",
            recu_depot_plis: "Reçu de Dépôt de Plis",
            pv_ouverture_plis: "Procès-Verbal d'Ouverture des Plis",
            pv_evaluation_attribution: "PV d'Évaluation et Proposition d'Attribution",
            selection_consultants: "Sélection de Consultants",
            dossier_smc_sfqc_sci: "Dossier Type pour SMC/SFQC/SCI",
            lettre_invitation: "Lettre d'invitation (Pièce N°1)",
            // Attribution - Administrative
            lettre_notification: "Lettre de Notification d'Attribution",
            nom_attributaire: "Nom de l'attributaire",
            delai_execution: "Délai d'exécution",
            publication_provisoire: "Publication provisoire (2 jours pour recours)",
            signature_contrat: "Signature du contrat",
            // Archivage - Administrative
            original_offres: "Original des offres",
            pv_archivage: "PV d'ouverture et d'évaluation",
            contrats_signes: "Contrats signés",
            preuves_publication: "Preuves de publication",
            chemises_archivage: "Chemises ou boîtes d'archivage étiquetées",
            double_numerique: "Double numérique recommandé",
            // Technical subcategories
            preuves_capacites_techniques: "Preuves de capacités techniques (projets similaires)",
            experience_generale_marche: "Expérience générale dans l'objet du marché",
            methodologie: "Méthodologie",
            personnel_cle: "Personnel clé",
            planning_travaux: "Planning travaux",
            calendrier_livraison: "Calendrier de livraison",
            conformite_techniques: "Conformité techniques",
            // Initiation - Technical
            description_besoin: "Description détaillée du besoin",
            // Sélection - Technical
            ddqe: "Devis Descriptif Quantitatif Estimatif - DDQE (Pièce N°3)",
            termes_reference: "Termes de Référence - TdR (Pièce N°3)",
            pv_evaluation_technique: "PV d'évaluation technique et financière",
            // Financial subcategories
            preuves_capacites_financieres: "Preuves de capacités financières",
            chiffre_affaires_annuel: "Chiffre d'affaires annuel moyen des activités",
            devis_quantitatif_estimatif: "Devis quantitatif estimatif",
            garantie_bancaire: "Garantie bancaire",
            garantie_soumission: "Garantie de soumission pour la période",
            // Initiation - Financial
            source_financement: "Source de financement",
            montant_alloue: "Montant alloué",
            // Sélection - Financial
            devis_comparatifs: "Devis comparatifs (3 minimum)",
            factures_commandes: "Factures et bons de commande",
            // Attribution - Financial
            montant_marche: "Montant du marché"
        }
    },

    ar: {
        common: {
            yes: "نعم",
            no: "لا",
            cancel: "إلغاء",
            save: "حفظ",
            delete: "حذف",
            edit: "تعديل",
            update: "تحديث",
            loading: "جاري التحميل...",
            load_data: "تحميل البيانات",
            error: "خطأ",
            success: "نجاح",
            info: "معلومات",
            back: "عودة",
            search: "بحث",
            filter: "تصفية",
            reset: "إعادة تعيين",
            submit: "إرسال",
            close: "إغلاق",
            confirm: "تأكيد",
            optional: "اختياري",
            required: "مطلوب",
            confirm_delete: "تأكيد الحذف",
            yes_delete: "نعم، احذف",
            no_cancel: "لا، إلغاء",
            create: "إنشاء",
            add: "إضافة",
            view: "عرض",
            details: "تفاصيل",
            actions: "إجراءات",
            status: "الحالة",
            date: "التاريخ",
            description: "الوصف",
            title: "العنوان",
            name: "الاسم",
            email: "البريد الإلكتروني",
            phone: "الهاتف",
            address: "العنوان",
            all: "الكل",
            none: "لا شيء",
            none_available: "لا يوجد متاح",
            no_data: "لا توجد بيانات متاحة",
            error_loading: "خطأ في التحميل",
            created_successfully: "تم الإنشاء بنجاح",
            updated_successfully: "تم التحديث بنجاح",
            deleted_successfully: "تم الحذف بنجاح",
            next: "التالي",
            previous: "السابق"
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
                deleted_successfully: "تم حذف الموظف بنجاح",
                subtitle:"موظفون"
            },
        locale: "اللغة",
        currency: {
            mru: "أوقية"
        },
        nav: {
            employees:"موظفون",
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
            tender_management: "إدارة العطاءات",
            supplier_portal: "بوابة المورد",
            supplier_tender_portal: "/soumissionaire/ بوابة المورد",
            supplier_dashboard: "لوحة المورد",
            supplier_access: "الوصول للمورد",
            evaluation_access: "وصول التقييم",
            access_secure: "وصول آمن",
            suppliers: "الموردون"
        },
        app: {
            name: "HadraTech-GPI"
        },
        project: {
            errors: {
                missing_id: "معرّف المشروع مفقود",
                not_found: "المشروع غير موجود"
            },
            labels: {
                project_manager: "مدير المشروع",
                main_contractor: "المقاول الرئيسي"
            },
            phase_label: "المرحلة",
            methodology: {
                standard: "قياسي (تتابعي)",
                agile: "أجايل",
                hybrid: "مختلط"
            }
        },
        role_based_route: {
            loading: "جاري التحميل...",
            denied_title: "تم رفض الوصول",
            denied_desc: "ليست لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.",
            required_roles: "الأدوار المطلوبة",
            back: "رجوع"
        },
        supplier_dashboard: {
            title: "لوحة تحكم المورد",
            subtitle: "تابع إشعاراتك ومدفوعاتك ووثائقك.",
            stats: {
                total_payments: "إجمالي المدفوعات",
                transactions: "معاملة",
                pending_payments: "مدفوعات معلّقة",
                processing: "قيد المعالجة",
                notifications: "الإشعارات",
                unread: "غير مقروءة",
                documents: "الوثائق",
                available: "متاحة"
            },
            tabs: {
                notifications: "الإشعارات",
                payments: "المدفوعات",
                documents: "الوثائق"
            },
            notifications: {
                title: "الإشعارات",
                unknown_date: "تاريخ غير معروف",
                new: "جديد",
                empty: "لا توجد إشعارات.",
                types: {
                    task_assignment: "إسناد مهمة",
                    task_notification: "إشعار مهمة",
                    task_comment: "تعليق على المهمة",
                    task_completed: "تم إكمال المهمة",
                    password_reset: "إعادة تعيين كلمة المرور"
                }
            },
            payments: {
                title: "المدفوعات",
                payment: "دفعة",
                amount: "المبلغ",
                unknown_date: "تاريخ غير معروف",
                paid: "مدفوع",
                pending: "معلّق",
                empty: "لا توجد مدفوعات."
            },
            documents: {
                title: "الوثائق",
                unknown_date: "تاريخ غير معروف",
                empty: "لا توجد وثائق."
            }
        },
        tenders: {
            supplierSecure: {
                title: "بوابة الوصول الآمن للمورد",
                description: "أدخل رمز المشاركة للوصول إلى مستندات العطاء",
                input_placeholder: "رمز-المشاركة",
                format_note: "التنسيق: 12 حرفًا أبجديًا رقميًا",
                validate_button: "الوصول إلى المستندات",
                validating: "جارٍ التحقق...",
                access_granted: "تم منح الوصول",
                access_denied: "تم رفض الوصول",
                invalid_code_desc: "الرجاء إدخال رمز صالح",
                validate_error_desc: "حدث خطأ أثناء التحقق من الرمز",
                security_title: "الأمان والخصوصية",
                security_items: {
                    secure_connection: "اتصال آمن ومشفّر",
                    audit_logs: "يتم تسجيل جميع عمليات الوصول",
                    compliant: "متوافق مع المعايير الموريتانية"
                },
                documents: {
                    title: "المستندات المتاحة",
                    description: "المستندات المشتركة لهذه المشاركة",
                    none: "لا توجد مستندات متاحة",
                    download: "تنزيل"
                },
                disconnect: "تسجيل الخروج",
                warning: {
                    title: "تذكير مهم",
                    text: "المستندات المتاحة عبر هذا الرمز سرية تمامًا. أي استخدام غير مصرح به أو مشاركة مع طرف ثالث غير مسموح وقد يؤدي إلى عقوبات وفقًا لقانون المناقصات العمومية الموريتاني."
                }
            }
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
            total: "إجمالي المستخدمين",
            cancel: "إلغاء",
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
            no_name: "مستخدم بدون اسم",
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
            management_title: "لوحة التحكم الإدارية",
            management_subtitle: "مركز التحكم لمديري المشاريع",
            checking_permissions: "جاري التحقق من الصلاحيات...",
            access_denied_title: "تم رفض الوصول",
            access_restricted: "لوحة التحكم هذه مخصصة لمديري المشاريع والمسؤولين والمديرين.",
            your_roles: "أدوارك الحالية",
            required_roles_label: "الأدوار المطلوبة",
            no_role_assigned: "لم يتم تعيين دور",
            back_to_projects: "العودة إلى المشاريع",
            management_tabs: {
                    actions: "إدارة الإجراءات",
                    overview: "نظرة عامة",
                    monitoring: "المراقبة",
                    alerts: {
                        total: "إجمالي التنبيهات",
                        critical: "حرج",
                        high: "عالي",
                        medium: "متوسط",
                        low: "منخفض",
                        tabs: {
                            all: "الكل",
                            delay: "تأخيرات",
                            payment: "المدفوعات",
                            inspection: "التفتيشات",
                            guarantee: "الضمانات"
                        },
                        delay_title: "تأخر المشروع",
                        delay_desc_prefix: "تأخير في",
                        delay_desc_suffix: "تم اكتشافه",
                        payment_blocked: "المدفوعات محتجزة",
                        payment_blocked_desc_prefix: "دفع بمقدار",
                        payment_blocked_desc_suffix: "محجوز",
                        validation_required: "مطلوب تحقق",
                        inspection_overdue: "تفتيش متأخر",
                        inspection_overdue_desc_prefix: "التفتيش لم يكتمل لـ",
                        days: "أيام",
                        guarantee_expiring: "ضمان بنكي على وشك الانتهاء",
                        guarantee_expiring_desc_prefix: "ضمان بمقدار",
                        guarantee_expiring_desc_suffix: "سينتهي بعد",
                        load_error: "فشل في تحميل التنبيهات",
                        acknowledge: "تأكيد الاستلام",
                        acknowledge_success: "تم تأكيد التنبيه",
                        acknowledge_description: "تم وضع علامة على التنبيه كمؤكد",
                        none: "لا توجد تنبيهات",
                        project_label: "المشروع"
                    }
                },
            cards: {
                active_projects: "المشاريع النشطة",
                in_progress_description: "قيد التنفيذ",
                projects_label: "مشاريع",
                total_budget: "الميزانية الإجمالية",
                financial_resources: "الموارد المالية",
                teams: "الفرق",
                staff_assigned: "الموظفون المعينون",
                members_label: "أعضاء",
                materials_title: "المواد",
                available_resources: "الموارد المتاحة",
                types_label: "أنواع",
                project_progress: "تقدم المشاريع",
                recent_projects: "المشاريع الأخيرة"
            },
            badges: {
                roles_label: "الأدوار",
                administrator: "مدير",
                director: "مدير تنفيذي",
                project_manager: "مدير مشروع"
            },
            monitoring: {
                http_status: "حالة HTTP",
                active: "نشط",
                real_time_monitoring: "المراقبة في الوقت الفعلي",
                critical: "حرجة",
                degraded: "متدهور",
                total_requests: "إجمالي الطلبات",
                error_rate: "معدل الأخطاء",
                recent_errors: "الأخطاء الأخيرة",
                success_rate: "معدل النجاح",
                avg_response_time: "متوسط زمن الاستجابة",
                recent_errors_desc: "آخر أخطاء HTTP المكتشفة في التطبيق",
                no_recent_errors: "لا توجد أخطاء حديثة",
                error_alert_message: "تم اكتشاف معدل أخطاء مرتفع. تحقق من اتصال الشبكة وحالة الخدمات.",
                status_success: "نجاح",
                status_redirect: "إعادة توجيه",
                status_client_error: "خطأ من العميل",
                status_server_error: "خطأ من الخادم",
                guarantees: "الضمانات المصرفية",
                alerts_count: "تنبيهات",
                expiring_soon: "الضمانات المنتهية قريباً",
                payment_control: "مراقبة المدفوعات",
                automatic_validation: "التحقق التلقائي",
                inspections: "التفتيشات",
                overdue: "متأخرة",
                overdue_inspections: "التفتيشات المتأخرة"
            },
            loading: "جاري التحميل...",
            title: "لوحة التحكم",
            welcome: "مرحباً",
            team_members: "الأعضاء",
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
            loading_stats: "جاري تحميل الإحصائيات...",
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
            map_no_data: "لا توجد بيانات جغرافية للعرض",
            legend_title: "وسيلة إيضاح",
            material_label: "مادة",
            materials_label: "مواد",
            start_label: "بداية",
            end_label: "نهاية",
            dev_mode: "وضع التطوير"
        },
        
        management_actions: {
            loading: "جاري التحميل...",
            error_title: "خطأ",
            error_loading: "تعذر تحميل الإجراءات",
            critical_actions: "إجراءات حرجة",
            critical_attention: "تتطلب انتباهاً فورياً",
            validations_pending: "التحقّقات المعلّقة",
            pending_validation: "في انتظار التحقق",
            urgent_tasks: "المهام العاجلة",
            to_do_quickly: "للإنجاز بسرعة",
            decisions_required: "قرارات مطلوبة",
            managerial_decisions: "قرارات إدارية",
            priority_actions: "الإجراءات ذات الأولوية",
            priority_description: "إجراءات تتطلب تدخلاً إدارياً فورياً",
            validation_payment_inspection: "تحقق الدفع - التفتيش",
            inspection_at: "تفتيش عند",
            payment_request: "طلب دفع",
            amount: "المبلغ",
            missed_inspection: "تفتيش فائت",
            days_overdue: "أيام تأخير",
            inspector: "المفتش",
            budget_review: "مراجعة الميزانية",
            project_at: "المشروع عند",
            budget_check_needed: "مراجعة الميزانية ضرورية",
            team_assignment: "تعيين فريق",
            new_project_starting: "مشروع جديد يبدأ - تعيين فريق المهندسين",
            category_validation: "التحقق",
            category_task: "مهمة",
            category_review: "مراجعة",
            category_decision: "قرار",
            category_action: "إجراء",
            project: "المشروع",
            deadline: "الموعد النهائي",
            link: "رابط",
            process: "معالجة",
            payment_control: "مراقبة المدفوعات",
            payment_control_desc: "التحقق من المدفوعات وإلغاء حظرها",
            access_control: "الوصول إلى التحكم",
            guarantee_monitoring: "مراقبة الضمانات",
            guarantee_monitoring_desc: "متابعة الضمانات المصرفية",
            monitor_guarantees: "مراقبة الضمانات",
            inspection_tracking: "متابعة التفتيشات",
            inspection_tracking_desc: "مراقبة التفتيشات",
            track_inspections: "متابعة التفتيشات"
        },
        bank_guarantee: {
            title: "مراقبة الضمانات المصرفية",
            subtitle: "نظام كشف آلي للتأخير وتفعيل الضمانات المصرفية",
            active_alerts: "تنبيه(ات) نشط(ة)",
            manager_alerts: "تنبيهات مدير المشروع",
            severity: "الخطورة",
            type: "النوع",
            acknowledge: "تأكيد الاستلام",
            acknowledged_note: "تم الأخذ بالاعتبار من المراقبة",
            loading_project: "جاري تحميل المشروع والمؤسسة..."
        },
        insurance_management: {
            title: "إدارة التأمينات",
            subtitle: "مراقبة آلية لشهادات التأمين وتنبيهات الانتهاء",
            active_alerts: "تنبيه(ات) نشط(ة)",
            manager_alerts: "تنبيهات التأمين من مدير المشروع",
            severity: "الخطورة",
            type: "النوع",
            detected_on: "تم الكشف في",
            process: "معالجة",
            processed_note: "تمت المعالجة من إدارة التأمينات",
            loading_project: "جاري تحميل المشروع والمؤسسة..."
        },
        notifications_center: {
            title: "مركز الإشعارات",
            subtitle: "نظام إشعارات مركزي مع إدارة التنبيهات والإشعارات حسب الدور",
            unread: "غير مقروءة",
            mark_all_read: "تحديد الكل كمقروء",
            refresh: "تحديث",
            mark_all_success: "تم تحديد جميع الإشعارات كمقروءة",
            load_error: "تعذر تحميل الإشعارات",
            mark_error: "تعذر تحديد الإشعارات كمقروءة",
            search_placeholder: "البحث في الإشعارات...",
            filters: "المرشحات",
            stats: {
                total: "الإجمالي",
                unread: "غير مقروءة",
                urgent: "عاجلة",
                inspections: "التفتيشات",
                projects: "المشاريع",
                payments: "المدفوعات",
                tasks: "المهام",
                documents: "الوثائق",
                system: "النظام"
            },
            tabs: {
                all: "الكل",
                role_based: "حسب الدور",
                inspections: "التفتيشات",
                projects: "المشاريع",
                payments: "المدفوعات",
                tasks: "المهام",
                documents: "الوثائق",
                system: "النظام",
                management: "الإدارة"
            },
            role_based_description: "الإشعارات المفلترة وفقاً لدورك ومسؤولياتك في النظام",
            no_notifications: "لا توجد إشعارات"
        },
        payment_control: {
            title: "مراقبة المدفوعات",
            subtitle: "إدارة والتحقق من المدفوعات مع الإشعارات في الوقت الفعلي",
            notifications_label: "الإشعارات",
            recent_notifications: "إشعارات الدفع الأخيرة",
            new: "جديد(ة)",
            no_recent: "لا توجد إشعارات دفع حديثة",
            no_pending: "لا توجد مدفوعات معلقة للتحقق",
            access_restricted: "وصول محدود. ليس لديك الصلاحيات اللازمة للوصول إلى مراقبة المدفوعات.",
            load_error: "تعذر تحميل إشعارات الدفع",
            loading_project: "جاري تحميل المشروع والمؤسسة..."
        },
        task: {
            edit: "تعديل المهمة",
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
                deleted_successfully: "تم حذف الموظف بنجاح",
                subtitle: "قائمة الموظفين"
            }
        },
        projects: {
            header: {
                title: "المشاريع",
                subtitle: "إدارة ومتابعة جميع مشاريع البناء الخاصة بك",
                new_project: "مشروع جديد",
                import_export: "استيراد/تصدير"
            },
            empty_state: {
                title: "لم يتم العثور على مشاريع",
                description: "قم بتعديل معايير البحث أو إنشاء مشروع جديد.",
                create_button: "إنشاء مشروع جديد"
            },
            delete: "حذف",
            payments_management: "إدارة المدفوعات",
            quick_payment_actions: "إجراءات الدفع السريعة",
            progress_done: "التقدم المنجز",
            overview: {
                description: "وصف المشروع"
            },
            timeline: "الجدول الزمني",
            start_date: "تاريخ البدء",
            started: "بدأ",
            end_date_expected: "تاريخ الانتهاء المتوقع",
            expected: "متوقع"
            ,
            progress: {
                percentage: "النسبة المئوية"
            },

            title: "المشاريع",
            all_desc: "جميع المشاريع",
            new: "جديد",
            add: "جديد",
            new_desc: "إنشاء مشروع جديد",
            all: "الكل",
            tab: {
                overview: "نظرة عامة",
                materials: "المواد",
                payments: "المدفوعات",
                inspections: "التفتيشات",
                workflow: "سير العمل",
                documents: "الوثائق",
                takeoffs: "الكميات"
            },
            takeoffs: {
                form: {
                    basic_info: "معلومات أساسية",
                    advanced: "حساب متقدم"
                },
                elements: {
                    measured: "العناصر المقاسة"
                },
                total: {
                    value: "القيمة الإجمالية",
                    quantity: "الكمية الإجمالية"
                },
            },
            edit: {
                title: "تعديل المشروع",
                subtitle: "تعديل تفاصيل المشروع",
                location_desc: "تفاصيل موقع المشروع",
                status_desc: "تفاصيل حالة المشروع",
                sync_with_inspection: "مزامنة مع التفتيش",
                saved: "تم حفظ المشروع",
                saved_desc: "تم حفظ المشروع بنجاح",
                error: "خطأ",
                save_error: "خطأ في حفظ المشروع",
                progress_synced: "تمت مزامنة التقدم",
                progress_synced_desc: "تمت مزامنة تقدم المشروع مع التفتيش",
                info: "معلومات",
                no_inspection: "لا توجد بيانات تفتيش",
                not_found: "المشروع غير موجود",
                load_error: "خطأ في تحميل المشروع",
                back_to_detail: "العودة إلى تفاصيل المشروع",
                market_type: "نوع السوق",
                market_type_placeholder: "اختر نوع السوق",
                selection_mode: "وضع الاختيار",
                selection_mode_placeholder: "اختر وضع الاختيار",
                title_placeholder: "Enter project title",
                location_placeholder: "Select location",
                status_placeholder: "Select status",
                progress_desc: "Specify project progress as a percentage.",
                progress_current: "Current progress: {value}%",
                description_placeholder: "Describe the project..."
            },
            loading_error: "خطأ في تحميل المشاريع",
            delete_confirm: "هل أنت متأكد من حذف هذا المشروع؟",
            deleted: "تم حذف المشروع",
            deleted_desc: "تم حذف المشروع بنجاح",
            delete_error: "خطأ في حذف المشروع",
            delete_error_desc: "حدث خطأ أثناء حذف المشروع.",
            loading_detail: "جاري تحميل تفاصيل المشروع...",
            not_found: "المشروع غير موجود",
            not_found_desc: "المشروع المطلوب غير موجود.",
            completed: "مكتمل",
            location: "الموقع",
            empty: "لا توجد مشاريع متاحة",
            importExport: {
                title: 'استيراد/تصدير المشاريع',
                description: 'استيراد أو تصدير مشاريعك بتنسيقات مختلفة',
                fileImport: 'استيراد الملفات',
                predefinedProjects: 'مشاريع محددة مسبقًا',
                export: 'تصدير',
                predefined2025: 'مشاريع محددة مسبقًا 2025',
                predefinedDescription: 'استيراد مشاريع محددة مسبقًا بيانات واقعية لموريتانيا',
                includedProjects: 'المشاريع المدرجة',
                infrastructureProjects: 'مشاريع البنية التحتية بميزانيات واقعية',
                diverseFunding: 'تنوع مصادر التمويل',
                variedMarkets: 'أنواع الأسواق المتنوعة (عامة، خاصة، شراكة)',
                timeline2025: 'الجدول الزمني 2025-2027',
            },
            import: {
                fileImport: 'استيراد المشاريع من ملف',
                fileImportDescription: 'استيراد مشاريعك من ملف Excel أو JSON أو CSV',
                importantInfo: 'معلومات مهمة',
                supportedFormats: 'التنسيقات المدعومة',
                maxSize: 'الحجم الأقصى',
                requiredColumns: 'الأعمدة المطلوبة',
                optionalColumns: 'الأعمدة الاختيارية',
                selectFile: 'حدد ملفًا أو اسحبه هنا',
                downloadTemplate: 'تنزيل نموذج',
                importing: 'جاري الاستيراد',
                importProjects: 'استيراد المشاريع',
                success: 'نجح الاستيراد',
                error: 'خطأ في الاستيراد',
                invalidFile: 'ملف غير صالح',
                fileTooLarge: 'الملف كبير جدًا. الحجم الأقصى المسموح به:',
                unsupportedFormat: 'تنسيق الملف غير مدعوم. التنسيقات المسموح بها: Excel (.xlsx, .xls), JSON (.json), CSV (.csv)',
                excelReadError: 'خطأ في قراءة ملف Excel',
                fileReadError: 'خطأ في قراءة الملف',
                invalidJson: 'ملف JSON غير صالح',
                csvReadError: 'خطأ في قراءة ملف CSV',
                noData: 'لم يتم العثور على بيانات في الملف',
                line: 'السطر',
                projectsImported: 'مشروع (مشاريع) تم استيرادها بنجاح',
                errors: 'خطأ (أخطاء)',
                detailedErrors: 'أخطاء مفصلة',
                defaultTitle: 'مشروع مستورد',
                exampleProject: 'مشروع نموذج 1',
                exampleDescription: 'وصف المشروع النموذجي',
            },
            export: {
                title: 'تصدير المشاريع',
                description: 'تصدير جميع مشاريعك بالتنسيق الذي تختاره',
                selectFormat: 'اختر تنسيق التصدير',
                jsonDesc: 'تنسيق منظم',
                excelDesc: 'جدول بيانات',
                csvDesc: 'قيم مفصولة',
                exportAs: 'تصدير بتنسيق',
                exporting: 'جاري التصدير',
                success: 'نجح التصدير',
                error: 'خطأ في التصدير',
                errorDescription: 'حدث خطأ أثناء تصدير المشاريع',
                noProjects: 'لا توجد مشاريع للتصدير',
                noProjectsDescription: 'لا توجد مشاريع متاحة للتصدير',
                noSelection: 'لم يتم تحديد أي مشروع',
                noSelectionDescription: 'يرجى تحديد مشروع واحد على الأقل للتصدير',
                projectsExported: 'مشروع (مشاريع) تم تصديرها بتنسيق',
                available: 'متاح (متاحة)',
                total: 'الإجمالي',
                selected: 'محدد (محددة)',
                availableFormats: 'تنسيقات التصدير المتاحة',
                createFirst: 'لا توجد مشاريع متاحة للتصدير. أنشئ بعض المشاريع أولاً',
                searchPlaceholder: 'البحث عن مشروع...',
                selectAll: 'تحديد الكل',
                clearSelection: 'إلغاء تحديد الكل',
                noResults: 'لم يتم العثور على مشاريع',
            },
        },
        materials: {
            estimated_duration: "المدة المقدرة",
            back_to_list: "العودة إلى القائمة",
            edit_details: "تعديل التفاصيل",
            cancel: "إلغاء",
            save_changes: "حفظ التغييرات",
            name_placeholder: "أدخل اسم المادة",
            description_placeholder: "أدخل الوصف",
            quantities_pricing: "الكميات والأسعار",
            quantity: "الكمية",
            min_quantity: "الكمية الأدنى",
            timeline: "الجدول الزمني",
            start_date: "تاريخ البدء",
            end_date: "تاريخ الانتهاء",
            edit: "تعديل المادة",
            deleting: "جاري حذف المادة...",
            delete: "حذف المادة",
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
            },
            supplier_info: {
                title: "معلومات الموردين",
                description: "تفاصيل واتصالات موردي المواد المحليين لدعم مشاريع البناء الخاصة بك.",

            },
            documents: {
                title: "وثائق المواد",
                subtitle: "إدارة جميع وثائق المواد (فواتير، شهادات، دليل الاستخدام)",
                upload: "رفع وثيقة",
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
                document_upload_info: "رفع وثائق للمادة (فواتير، شهادات، دليل الاستخدام، إلخ)",
                document_save_later: "سيتم حفظ الوثائق بعد إنشاء المادة",
                upload_title: "رفع وثائق",
                upload_description: "قم برفع الوثائق التي ستكون مرتبطة بهذه المادة",
                types_title: "أنواع الوثائق المدعومة:",
                types: {
                    invoice: "فاتورة",
                    delivery_note: "إشعار تسليم",
                    warranty: "ضمان",
                    certificate: "شهادة",
                    manual: "دليل",
                    photo: "صورة",
                    contract: "عقد",
                    report: "تقرير",
                    other: "أخرى"
                },
                invoice_desc: "إثباتات الشراء والتسليم",
                certificate_desc: "الجودة والامتثال والأمان",
                manual_desc: "تعليمات الاستخدام",
                warranty_desc: "وثائق الضمان",
                save_reminder_title: "حفظ تلقائي",
                save_reminder_text: "سيتم ربط الوثائق تلقائياً بالمادة بعد إنشائها."
            },
            warehouse_location: "موقع المستودع",
        },
        project_import: {
            title: "استيراد المشاريع",
            desc: "استيراد المشاريع من ملف Excel"
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
            by_hadratech: "By HADRATECH حضراتك",
            quick_links: "روابط سريعة",
            legal: "قانوني"
        },
        notfound: {
            message: "الصفحة غير موجودة",
            return_home: "العودة للرئيسية"
        },
        inspection: {
            common: {
                back: "رجوع",
                loading: "جاري التحميل...",
                save: "حفظ",
                saving: "جاري الحفظ...",
                cancel: "إلغاء",
                error: "خطأ",
                success: "نجاح",
                not_found: "التفتيش غير موجود",
                load_error: "تعذر تحميل التفتيش",
                update_success: "تم تحديث التفتيش بنجاح",
                update_error: "تعذر تحديث التفتيش",
                required_fields: "يرجى ملء جميع الحقول المطلوبة",
                inspector_required: "المفتش *",
                inspector_placeholder: "اسم المفتش",
                date_label: "تاريخ التفتيش *",
                status_label: "الحالة",
                progress_label: "التقدم (%)",
                comments_label: "التعليقات",
                comments_placeholder: "تعليقاتك...",
                project_label: "المشروع"
            },
            status: {
                scheduled: "مجدول",
                in_progress: "قيد التنفيذ",
                approved: "مقبول",
                rejected: "مرفوض",
                requires_changes: "يتطلب تعديلات"
            },
            edit: {
                title: "تعديل التفتيش",
                description: "تعديل التفتيش للمشروع",
                in_development: "قيد التطوير"
            },
            create: {
                title: "إنشاء تفتيش",
                description: "إنشاء تفتيش جديد للمشروع",
                in_development: "قيد التطوير"
            },
            dialog: {
                new_inspection: "فحص جديد",
                title: "تفتيش الموقع",
                description: "إنشاء فحص جديد للمشروع",
                date: "تاريخ الفحص",
                select_date: "اختر تاريخًا",
                inspector: "المفتش",
                inspector_placeholder: "اسم المفتش",
                status: "حالة الفحص",
                select_status: "اختر الحالة",
                status_pending: "قيد الانتظار",
                status_approved: "مقبول",
                status_requires_changes: "يتطلب تعديلات",
                status_rejected: "مرفوض",
                progress: "التقدم (%)",
                comments: "تعليقات",
                comments_placeholder: "أدخل ملاحظاتك",
                cancel: "إلغاء",
                create: "إنشاء",
                creating: "جاري الإنشاء...",
                created: "تم إنشاء الفحص",
                created_description: "تمت إضافة الفحص بنجاح.",
                error: "خطأ",
                error_description: "حدث خطأ أثناء إنشاء الفحص.",
                validation_error: "خطأ في التحقق",
                validation_inspector: "اسم المفتش مطلوب."
            },
        },
        profile: {
            title: "الملف الشخصي",
            user_id_label: "معرف المستخدم",
            account_security: "أمان الحساب",
            change_password: "تغيير كلمة المرور",
            change_password_description: "قم بتغيير كلمة المرور الخاصة بك لتأمين حسابك.",
            new_password: "كلمة المرور الجديدة",
            new_password_placeholder: "أدخل كلمة المرور الجديدة",
            confirm_password: "تأكيد كلمة المرور الجديدة",
            confirm_password_placeholder: "أكد كلمة المرور الجديدة",
            password_mismatch: "كلمات المرور الجديدة غير متطابقة.",
            password_length_error: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
            password_updated: "تم تحديث كلمة المرور بنجاح",
            update_password: "تحديث كلمة المرور",
            updating: "جاري التحديث..."
        },
        reset_password: {
            title: "كلمة مرور جديدة",
            invalid_link: "رابط غير صالح",
            checking_link: "جاري التحقق من الرابط...",
            invalid_expired: "رابط إعادة التعيين هذا غير صالح أو منتهي الصلاحية.",
            back_to_login: "العودة إلى تسجيل الدخول",
            update_button: "تحديث كلمة المرور",
            password_mismatch: "كلمات المرور غير متطابقة.",
            password_length_error: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
            update_error: "خطأ في تحديث كلمة المرور.",
            invalid_link_error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية."
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
        terms: {
            title: "شروط الخدمة",
            last_update: "آخر تحديث: 21 يوليو 2025",
            section1: {
                title: "1. قبول الشروط",
                text: "باستخدامك لبرنامجنا، سواء كخدمة SaaS أو على البنية التحتية الخاصة بك، فإنك توافق على الالتزام بهذه الشروط."
            },
            section2: {
                title: "2. استخدام خدمة SaaS",
                text: "نظام SaaS لدينا مستضاف في السحابة ويتم الوصول إليه عبر الإنترنت. أنت مسؤول عن الحفاظ على سرية بيانات حسابك وجميع الأنشطة التي تتم تحت حسابك."
            },
            section3: {
                title: "3. النشر على الموقع",
                text: "إذا قمت بنشر البرنامج على بنيتك التحتية الخاصة (على الموقع)، فإنك توافق على الالتزام بجميع تعليمات التثبيت والصيانة والأمان المقدمة من HadraTech. شركة HadraTech غير مسؤولة عن المشكلات الناتجة عن بيئتك أو سوء الاستخدام."
            },
            section4: {
                title: "4. الاستضافة السحابية",
                text: "بالنسبة لمستخدمي SaaS، يتم استضافة برنامجنا على بنية تحتية سحابية آمنة. نحن نستخدم ممارسات أمنية معيارية لحماية بياناتك، لكن لا يوجد نظام آمن بنسبة 100%."
            },
            section5: {
                title: "5. منح الترخيص",
                text: "تمنحك HadraTech ترخيصًا غير حصري وغير قابل للنقل لاستخدام البرنامج وفقًا لشروط اشتراكك أو اتفاقية الترخيص الخاصة بك. لا يجوز لك ترخيص البرنامج من الباطن أو تأجيره أو تأجيره."
            },
            section6: {
                title: "6. القيود",
                text: "لا يجوز لك: إعادة هندسة البرنامج عكسيًا، فك التشفير، التعديل، أو إنشاء أعمال مشتقة منه إلا إذا سمح القانون بذلك صراحة أو بموافقة كتابية من HadraTech."
            },
            section7: {
                title: "7. الدفع والرسوم",
                text: "يخضع استخدام خدمة SaaS لدفع رسوم الاشتراك المطبقة. قد تتطلب تراخيص النشر على الموقع دفع رسوم مرة واحدة أو متكررة كما هو موضح في اتفاقية الترخيص الخاصة بك."
            },
            section8: {
                title: "8. الإنهاء",
                text: "يجوز لـ HadraTech تعليق أو إنهاء وصولك إذا انتهكت هذه الشروط. عند الإنهاء، ينتهي ترخيصك لاستخدام البرنامج ويجب عليك التوقف عن الاستخدام."
            },
            section9: {
                title: "9. تحديد المسؤولية",
                text: "لا تتحمل HadraTech المسؤولية عن الأضرار غير المباشرة أو التبعية الناشئة عن استخدام أو عدم القدرة على استخدام البرنامج."
            },
            section10: {
                title: "10. القانون الواجب التطبيق",
                text: "تخضع هذه الشروط وتفسر وفقًا لقوانين الولاية القضائية التي تم تأسيس HadraTech فيها."
            },
            rights: "جميع الحقوق محفوظة",
            by_hadratech: "تم التطوير بواسطة HadraTech",
            about_desc: "تم تصميم نظام ERP لإدارة البناء الخاص بنا لتبسيط وتحسين جميع جوانب مشاريع البناء الخاصة بك."
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
                powered: "مدعوم",
                login_to_access: "تسجيل الدخول للوصول",
                register: "إنشاء حساب",
                management: "  إدارة مشاريع, إدارة المواد",
                system: " إدارة مشاريع, لإدارة المواد",
                message: "تثمين التراث باستخدام المواد المحلية",
                details: "تابعوا مشاريعكم الإنشائية باستخدام حجر أطار/العيون، الصدف/نواكشوط والطين الموريتاني. حلّنا يُحسِّن إدارة مشاريع البناء، خصوصًا باستخدام المواد المحلية، ويحافظ على التقنيات التقليدية."

            },
direction_features: {
    title: "لوحات القيادة الاستراتيجية",
    description: "توجيه الاستثمارات والتخطيط الطاقوي",
    powered: "إدارة مشروع متكاملة، مدعومة من HadraTech",
    system: "نظام للإشراف ومساعدة في اتخاذ القرار",
    details: "تصور مؤشرات الأداء في الوقت الفعلي، خطط لاستثمارات البنية التحتية وحسن توزيع الموارد الطاقوية على الصعيد الوطني.",
    management: "إدارة الأصول والصيانة الوقائية",
    message: "تتبع وتحسين البنى التحتية للطاقة"
},

consulting_features: {
    title: "الهندسة ودراسات المشاريع",
    description: "تصميم ومحاكاة الشبكات الكهربائية",
    system: "منصة للنمذجة والتقييس",
    details: "ادرس الجدوى التقنية للمشاريع، قم بتقييس شبكات التوزيع ومحاكاة تأثير البنى التحتية الطاقوية الجديدة.",
    message: "تحسين الشبكات لتوزيع فعال للطاقة",
    management: "إدارة مشاريع الهندسة",
    powered: "إدارة مشروع متكاملة، مدعومة من HadraTech"
},

procurement_features: {
    title: "إدارة سلسلة التوريد",
    description: "تحسين المشتريات ومخزونات الطاقة",
    system: "نظام تتبع المعدات",
    details: "إدرة طلبات العروض، تتبع طلبيات المحولات، الكابلات والعدادات، وتحسين مستويات المخزون لضمان استمرارية الخدمة."
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
                started: "بدأ",
                end_date_expected: "تاريخ النهاية المتوقع",
                delete: "حذف",
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
                facilities_location: "موقع المرافق",
                title_placeholder: "Enter project title",
                location_placeholder: "Select location",
                status_placeholder: "Select status",
                progress_desc: "Specify project progress as a percentage.",
                progress_current: "Current progress: {value}%",
                description_placeholder: "Describe the project..."
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
            // Administrative subcategories
            lettre_soumission: "خطاب التقديم",
            pouvoir_signature: "تفويض التوقيع",
            acte_groupement: "عقد التجمع",
            attestation_impot: "شهادة ضريبية",
            attestation_cnss: "شهادة الضمان الاجتماعي",
            attestation_non_faillite: "شهادة عدم الإفلاس",
            renseignement_soumissionnaire: "معلومات مقدم العرض",
            // Planification (PAA) - Administrative
            plan_annuel_achats: "خطة المشتريات السنوية (PAA)",
            modele_paa: "نموذج خطة المشتريات السنوية",
            validation_ordonnateur: "مصادقة الآمر بالصرف",
            publication_armp: "النشر على موقع ARMP",
            // Initiation - Administrative
            demande_initiation: "طلب بدء إجراء",
            procedure_proposee: "الإجراء المقترح",
            // Sélection - Administrative
            consultation_directe: "الاستشارة المباشرة (≤ 600,000 أوقية)",
            consultation_concurrentielle: "الاستشارة التنافسية",
            lettre_consultation: "خطاب الاستشارة (الوثيقة رقم 1)",
            modele_soumission: "نموذج العرض (الوثيقة رقم 2)",
            modele_contrat: "نموذج العقد (الوثيقة رقم 4)",
            registre_reception_plis: "سجل استلام المظاريف",
            recu_depot_plis: "إيصال إيداع المظاريف",
            pv_ouverture_plis: "محضر فتح المظاريف",
            pv_evaluation_attribution: "محضر التقييم واقتراح المنح",
            selection_consultants: "اختيار الاستشاريين",
            dossier_smc_sfqc_sci: "ملف نموذجي لـ SMC/SFQC/SCI",
            lettre_invitation: "خطاب الدعوة (الوثيقة رقم 1)",
            // Attribution - Administrative
            lettre_notification: "خطاب إشعار المنح",
            nom_attributaire: "اسم صاحب العرض الفائز",
            delai_execution: "مدة التنفيذ",
            publication_provisoire: "النشر المؤقت (يومان للطعن)",
            signature_contrat: "توقيع العقد",
            // Archivage - Administrative
            original_offres: "أصل العروض",
            pv_archivage: "محضر الفتح والتقييم",
            contrats_signes: "العقود الموقعة",
            preuves_publication: "إثباتات النشر",
            chemises_archivage: "ملفات أو صناديق الأرشفة المُوسمة",
            double_numerique: "نسخة رقمية موصى بها",
            // Technical subcategories
            preuves_capacites_techniques: "إثباتات القدرات التقنية (مشاريع مماثلة)",
            experience_generale_marche: "الخبرة العامة في موضوع الصفقة",
            methodologie: "المنهجية",
            personnel_cle: "الموظفون الرئيسيون",
            planning_travaux: "برنامج الأعمال",
            calendrier_livraison: "جدول التسليم",
            conformite_techniques: "المطابقة التقنية",
            // Initiation - Technical
            description_besoin: "وصف مفصل للحاجة",
            // Sélection - Technical
            ddqe: "تقدير وصفي كمي تقديري - DDQE (الوثيقة رقم 3)",
            termes_reference: "شروط المرجع - TdR (الوثيقة رقم 3)",
            pv_evaluation_technique: "محضر التقييم التقني والمالي",
            // Financial subcategories
            preuves_capacites_financieres: "إثباتات القدرات المالية",
            chiffre_affaires_annuel: "متوسط رقم الأعمال السنوي للأنشطة",
            devis_quantitatif_estimatif: "تقدير كمي تقديري",
            garantie_bancaire: "ضمان مصرفي",
            garantie_soumission: "ضمان العرض للفترة",
            // Initiation - Financial
            source_financement: "مصدر التمويل",
            montant_alloue: "المبلغ المخصص",
            // Sélection - Financial
            devis_comparatifs: "عروض أسعار مقارنة (3 كحد أدنى)",
            factures_commandes: "فواتير وأوامر الشراء",
            // Attribution - Financial
            montant_marche: "مبلغ الصفقة"
        }
    },

    en: {
        common: {
            yes: "Yes",
            no: "No",
            cancel: "Cancel",
            save: "Save",
            delete: "Delete",
            edit: "Edit",
            update: "Update",
            loading: "Loading...",
            load_data: "Load data",
            error: "Error",
            success: "Success",
            info: "Information",
            back: "Back",
            search: "Search",
            filter: "Filter",
            reset: "Reset",
            submit: "Submit",
            close: "Close",
            confirm: "Confirm",
            optional: "Optional",
            required: "Required",
            confirm_delete: "Confirm delete",
            yes_delete: "Yes, delete",
            no_cancel: "No, cancel",
            create: "Create",
            add: "Add",
            view: "View",
            details: "Details",
            actions: "Actions",
            status: "Status",
            date: "Date",
            description: "Description",
            title: "Title",
            name: "Name",
            email: "Email",
            phone: "Phone",
            address: "Address",
            all: "All",
            none: "None",
            none_available: "None available",
            no_data: "No data available",
            error_loading: "Error loading",
            created_successfully: "Created successfully",
            updated_successfully: "Updated successfully",
            deleted_successfully: "Deleted successfully",
            next: "Next",
            previous: "Previous"
        },
        app: {
            name: "HadraTech-GPI"
        },
        project: {
            errors: {
                missing_id: "Project ID missing",
                not_found: "Project not found"
            },
            labels: {
                project_manager: "Project Manager",
                main_contractor: "Main Contractor"
            },
            phase_label: "Phase",
            methodology: {
                standard: "Standard (Cascade)",
                agile: "Agile",
                hybrid: "Hybrid"
            }
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
            deleted_successfully: "Employé supprimé avec succès",
            subtitle: "Gérer les employés et leur hiérarchie organisationnelle",
        },
        nav: {
            employees : "Employées",
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
            },
            supplier_portal: "Supplier Portal",
            supplier_tender_portal: "Supplier Bid Portal",
            supplier_dashboard: "Supplier Dashboard",
            suppliers: "Suppliers"
        },
        role_based_route: {
            loading: "Loading...",
            denied_title: "Access Denied",
            denied_desc: "You don’t have permission to access this page.",
            required_roles: "Required roles",
            back: "Go back"
        },
        supplier_dashboard: {
            title: "Supplier Dashboard",
            subtitle: "Track your notifications, payments, and documents.",
            stats: {
                total_payments: "Total payments",
                transactions: "transactions",
                pending_payments: "Pending payments",
                processing: "Processing",
                notifications: "Notifications",
                unread: "unread",
                documents: "Documents",
                available: "available"
            },
            tabs: {
                notifications: "Notifications",
                payments: "Payments",
                documents: "Documents"
            },
            notifications: {
                title: "Notifications",
                unknown_date: "Unknown date",
                new: "New",
                empty: "No notifications.",
                types: {
                    task_assignment: "Task assignment",
                    task_notification: "Task notification",
                    task_comment: "Task comment",
                    task_completed: "Task completed",
                    password_reset: "Password reset"
                }
            },
            payments: {
                title: "Payments",
                payment: "Payment",
                amount: "Amount",
                unknown_date: "Unknown date",
                paid: "Paid",
                pending: "Pending",
                empty: "No payments."
            },
            documents: {
                title: "Documents",
                unknown_date: "Unknown date",
                empty: "No documents."
            }
        },
        tenders: {
            supplierSecure: {
                title: "Supplier Secure Access",
                description: "Enter your sharing code to access tender documents",
                input_placeholder: "SHARE-CODE",
                format_note: "Format: 12 alphanumeric characters",
                validate_button: "Access Documents",
                validating: "Validating...",
                access_granted: "Access Granted",
                access_denied: "Access Denied",
                invalid_code_desc: "Please enter a valid code",
                validate_error_desc: "Error validating the code",
                security_title: "Security and Privacy",
                security_items: {
                    secure_connection: "Secure, encrypted connection",
                    audit_logs: "All accesses are recorded",
                    compliant: "Compliant with Mauritanian standards"
                },
                documents: {
                    title: "Accessible Documents",
                    description: "Documents shared for this submission",
                    none: "No documents available",
                    download: "Download"
                },
                disconnect: "Sign out",
                warning: {
                    title: "Important reminder",
                    text: "Documents accessed via this code are strictly confidential. Any unauthorized use or sharing with third parties is prohibited and may result in penalties under the Mauritanian public procurement code."
                }
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
            no_name: "User without name",
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
            management_title: "🏢 Management Dashboard",
            management_subtitle: "Control center for project managers",
            checking_permissions: "Checking permissions...",
            access_denied_title: "Access Denied",
            access_restricted: "This dashboard is reserved for project managers, administrators, and directors.",
            your_roles: "Your current roles",
            required_roles_label: "Required roles",
            no_role_assigned: "No role assigned",
            back_to_projects: "Back to Projects",
            management_tabs: {
                actions: "Actions Management",
                overview: "Overview",
                monitoring: "Monitoring",
                alerts: "Alerts"
            },
            cards: {
                active_projects: "Active Projects",
                in_progress_description: "In progress",
                projects_label: "projects",
                total_budget: "Total Budget",
                financial_resources: "Financial resources",
                teams: "Teams",
                staff_assigned: "Assigned staff",
                members_label: "members",
                materials_title: "Materials",
                available_resources: "Available resources",
                types_label: "types",
                project_progress: "Project Progress",
                recent_projects: "Recent Projects"
            },
            badges: {
                roles_label: "Roles",
                administrator: "Administrator",
                director: "Director",
                project_manager: "Project Manager"
            },
            monitoring: {
                http_status: "HTTP Status",
                active: "Active",
                real_time_monitoring: "Real-time monitoring",
                critical: "Critical",
                degraded: "Degraded",
                total_requests: "Total requests",
                error_rate: "Error rate",
                recent_errors: "Recent errors",
                success_rate: "Success rate",
                avg_response_time: "Average response time",
                recent_errors_desc: "Latest HTTP errors detected in the application",
                no_recent_errors: "No recent errors",
                error_alert_message: "High error rate detected. Check network connectivity and service health.",
                status_success: "Success",
                status_redirect: "Redirect",
                status_client_error: "Client Error",
                status_server_error: "Server Error",
                guarantees: "Bank Guarantees",
                alerts_count: "Alerts",
                expiring_soon: "Expiring soon guarantees",
                payment_control: "Payment Control",
                automatic_validation: "Automatic validation",
                inspections: "Inspections",
                overdue: "Overdue",
                overdue_inspections: "Overdue inspections"
            },
            loading: "Loading...",
            title: "Dashboard",
            welcome: "Welcome",
            team_members: "Members",
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
            loading_stats: "Loading statistics...",
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
            map_no_data: "No geolocated data to display",
            legend_title: "Legend",
            material_label: "Material",
            materials_label: "Materials",
            start_label: "Start",
            end_label: "End",
            dev_mode: "Development Mode"
        },
        management_actions: {
            loading: "Loading...",
            error_title: "Error",
            error_loading: "Failed to load actions",
            critical_actions: "Critical Actions",
            critical_attention: "Require immediate attention",
            validations_pending: "Validations Pending",
            pending_validation: "Pending validation",
            urgent_tasks: "Urgent Tasks",
            to_do_quickly: "To be done quickly",
            decisions_required: "Decisions Required",
            managerial_decisions: "Managerial decisions",
            priority_actions: "Priority Actions",
            priority_description: "Actions requiring immediate managerial intervention",
            validation_payment_inspection: "Payment Validation - Inspection",
            inspection_at: "Inspection at",
            payment_request: "Payment Request",
            amount: "Amount",
            missed_inspection: "Missed Inspection",
            days_overdue: "days overdue",
            inspector: "Inspector",
            budget_review: "Budget Review",
            project_at: "Project at",
            budget_check_needed: "budget check needed",
            team_assignment: "Team Assignment",
            new_project_starting: "New project starting - assign engineering team",
            category_validation: "Validation",
            category_task: "Task",
            category_review: "Review",
            category_decision: "Decision",
            category_action: "Action",
            project: "Project",
            deadline: "Deadline",
            link: "Link",
            process: "Process",
            payment_control: "Payment Control",
            payment_control_desc: "Validate and unblock payments",
            access_control: "Access Control",
            guarantee_monitoring: "Guarantee Monitoring",
            guarantee_monitoring_desc: "Track bank guarantees",
            monitor_guarantees: "Monitor Guarantees",
            inspection_tracking: "Inspection Tracking",
            inspection_tracking_desc: "Inspection monitoring",
            track_inspections: "Track Inspections"
        },
        bank_guarantee: {
            title: "Bank Guarantee Monitoring",
            subtitle: "Automated system for detecting delays and triggering bank guarantees",
            active_alerts: "Active Alert(s)",
            manager_alerts: "Project Manager Alerts",
            severity: "Severity",
            type: "Type",
            acknowledge: "Acknowledge",
            acknowledged_note: "Acknowledged from monitoring",
            loading_project: "Loading project and organization...",
            load_delays_error: "Failed to load project delays",
            not_found_for_project: "No bank guarantee found for this project",
            bank_notified_prefix: "Bank has been notified of delay on",
            internal_notifications_sent: "internal notifications sent",
            notification_send_failed: "Failed to send bank notification",
            project_not_found: "Project not found",
            critical_projects: "critical delayed project(s)",
            critical_alerts_desc: "Delays exceed contractual thresholds. Immediate action required.",
            no_critical_delays_title: "No critical delays detected",
            no_critical_delays_desc: "All projects comply with contractual deadlines.",
            notify_sending: "Sending...",
            notify_bank: "Notify Bank",
            view_project: "View Project",
            delay_label: "Delay",
            days_label: "days",
            contractor_label: "Contractor",
            planned_date_label: "Planned date",
            milestones_missed_label: "Milestones missed",
            escalation_thresholds_title: "Escalation Thresholds",
            delay_percentage_suffix: "% delay",
            severity_labels: {
                delay_alert: "Delay Alert",
                bank_notification: "Bank Notification",
                guarantee_trigger: "Guarantee Trigger"
            },
            escalation: {
                legal: "Legal Escalation"
            },
            actions: {
                task_assignment_title: "Project delay handling",
                task_assignment_msg_prefix: "Please handle the delay of",
                hierarchy_notification_title: "Critical delay alert",
                hierarchy_notification_msg_prefix: "The project",
                sms_title: "Project delay SMS",
                sms_msg_prefix: "SMS: Delay",
                call_title: "Project delay call",
                call_msg_prefix: "Call regarding project delay",
                email_title: "Project delay email",
                email_msg_prefix: "Email regarding project delay",
                mail_title: "Project delay mail",
                mail_msg_prefix: "Mail regarding project delay"
            },
            unknown_action_type: "Unknown action type",
            action_created_success: "{title} created successfully",
        },
        insurance_management: {
            title: "Insurance Management",
            subtitle: "Automated monitoring of insurance certificates and expiry alerts",
            active_alerts: "Active Alert(s)",
            manager_alerts: "Insurance Alerts from Project Manager",
            severity: "Severity",
            type: "Type",
            detected_on: "Detected on",
            process: "Process",
            processed_note: "Processed from insurance management",
            loading_project: "Loading project and organization..."
        },
        notifications_center: {
            title: "Notifications Center",
            subtitle: "Centralized notification system with alert management and role-based notifications",
            unread: "unread",
            mark_all_read: "Mark all as read",
            refresh: "Refresh",
            mark_all_success: "All notifications have been marked as read",
            load_error: "Failed to load notifications",
            mark_error: "Failed to mark notifications as read",
            search_placeholder: "Search in notifications...",
            filters: "Filters",
            stats: {
                total: "Total",
                unread: "Unread",
                urgent: "Urgent",
                inspections: "Inspections",
                projects: "Projects",
                payments: "Payments",
                tasks: "Tasks",
                documents: "Documents",
                system: "System"
            },
            tabs: {
                all: "All",
                role_based: "By Role",
                inspections: "Inspections",
                projects: "Projects",
                payments: "Payments",
                tasks: "Tasks",
                documents: "Documents",
                system: "System",
                management: "Management"
            },
            role_based_description: "Notifications filtered according to your role and responsibilities in the system",
            no_notifications: "No notifications"
        },
        payment_control: {
            title: "Payment Control",
            subtitle: "Payment management and validation with real-time notifications",
            notifications_label: "Notifications",
            recent_notifications: "Recent Payment Notifications",
            new: "new",
            no_recent: "No recent payment notifications",
            no_pending: "No pending payments for validation",
            access_restricted: "Restricted access. You don't have the necessary permissions to access payment control.",
            load_error: "Failed to load payment notifications",
            loading_project: "Loading project and organization..."
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
                deleted_successfully: "Employee deleted successfully",
                subtitle : "liste employees"
            }
        },
        projects: {
            header: {
                title: "Projects",
                subtitle: "Manage and track all your construction projects",
                new_project: "New Project",
                import_export: "Import/Export"
            },
            empty_state: {
                title: "No projects found",
                description: "Modify your search criteria or create a new project.",
                create_button: "Create New Project"
            },
            loading_detail: "Loading details...",
            title: "Projects",
            all_desc: "All projects",
            new: "New",
            add: "New",
            new_desc: "Create a new project",
            all: "All",
            tab: {
                overview: "Overview",
                materials: "Materials",
                payments: "Payments",
                inspections: "Inspections",
                workflow: "Workflow",
                documents: "Documents",
                takeoffs: "Takeoffs"
            },
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
                selection_mode_placeholder: "Select selection mode",
                title_placeholder: "Enter project title",
                location_placeholder: "Select location",
                status_placeholder: "Select status",
                progress_desc: "Specify project progress as a percentage.",
                progress_current: "Current progress: {value}%",
                description_placeholder: "Describe the project..."
            },
            loading_error: "Error loading projects",
            delete_confirm: "Are you sure you want to delete this project?",
            deleted: "Project deleted",
            deleted_desc: "Project deleted successfully",
            delete_error: "Error deleting project",
            delete_error_desc: "An error occurred while deleting the project.",
            not_found: "Project not found",
            not_found_desc: "The requested project could not be found.",
            payments_management: "Payments Management",
            quick_payment_actions: "Quick Payment Actions",
            progress_done: "Progress done",
            overview: {
                description: "Project overview"
            },
            timeline: "Timeline",
            completed: "Completed",
            expected: "Expected",
            location: "Location",
            empty: "No projects available",
            start_date: "Start Date",
            started: "Started",
            end_date_expected: "Expected End Date",
            delete: "Delete",
            importExport: {
                title: 'Project Import/Export',
                description: 'Import or export your projects in different formats',
                fileImport: 'File Import',
                predefinedProjects: 'Predefined Projects',
                export: 'Export',
                predefined2025: 'Predefined Projects 2025',
                predefinedDescription: 'Import predefined projects with realistic data for Mauritania',
                includedProjects: 'Included Projects',
                infrastructureProjects: 'Infrastructure projects with realistic budgets',
                diverseFunding: 'Diverse funding sources',
                variedMarkets: 'Varied market types (public, private, PPP)',
                timeline2025: 'Timeline 2025-2027',
            },
            import: {
                fileImport: 'Project File Import',
                fileImportDescription: 'Import your projects from Excel, JSON or CSV file',
                importantInfo: 'Important Information',
                supportedFormats: 'Supported Formats',
                maxSize: 'Maximum Size',
                requiredColumns: 'Required Columns',
                optionalColumns: 'Optional Columns',
                selectFile: 'Select a file or drag it here',
                downloadTemplate: 'Download Template',
                importing: 'Importing',
                importProjects: 'Import Projects',
                success: 'Import Successful',
                error: 'Import Error',
                invalidFile: 'Invalid File',
                fileTooLarge: 'File is too large. Maximum allowed size:',
                unsupportedFormat: 'Unsupported file format. Allowed formats: Excel (.xlsx, .xls), JSON (.json), CSV (.csv)',
                excelReadError: 'Error reading Excel file',
                fileReadError: 'Error reading file',
                invalidJson: 'Invalid JSON file',
                csvReadError: 'Error reading CSV file',
                noData: 'No data found in file',
                line: 'Line',
                projectsImported: 'project(s) imported successfully',
                errors: 'error(s)',
                detailedErrors: 'Detailed Errors',
                defaultTitle: 'Imported Project',
                exampleProject: 'Example Project 1',
                exampleDescription: 'Example project description',
            },
            export: {
                title: 'Export Projects',
                description: 'Export all your projects in your chosen format',
                selectFormat: 'Choose export format',
                jsonDesc: 'Structured format',
                excelDesc: 'Spreadsheet',
                csvDesc: 'Separated values',
                exportAs: 'Export as',
                exporting: 'Exporting',
                success: 'Export Successful',
                error: 'Export Error',
                errorDescription: 'An error occurred while exporting projects',
                noProjects: 'No projects to export',
                noProjectsDescription: 'No projects available for export',
                noSelection: 'No project selected',
                noSelectionDescription: 'Please select at least one project to export',
                projectsExported: 'project(s) exported as',
                available: 'available',
                total: 'Total',
                selected: 'Selected',
                availableFormats: 'Available Export Formats',
                createFirst: 'No projects available for export. Create some projects first',
                searchPlaceholder: 'Search for a project...',
                selectAll: 'Select all',
                clearSelection: 'Clear selection',
                noResults: 'No projects found',
            },
            takeoffs: {
                elements: {
                    measured: "Measured elements"
                },
                total: {
                    value: "Total value",
                    quantity: "Total quantity"
                }
            }
        },
        materials: {
            estimated_duration: "Estimated Duration",
            back_to_list: "Back to List",
            edit_details: "Edit Details",
            cancel: "Cancel",
            save_changes: "Save Changes",
            name_placeholder: "Enter material name",
            description_placeholder: "Enter description",
            quantities_pricing: "Quantities & Pricing",
            quantity: "Quantity",
            min_quantity: "Minimum Quantity",
            timeline: "Timeline",
            start_date: "Start Date",
            end_date: "End Date",
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
            },
            supplier_info: {
                title: "Supplier Information",
                description: "Details and contacts of local materials suppliers to support your construction projects.",
            },
            warehouse_location: "Warehouse Location and Geolocalistion",
        },
        project_import: {
            title: "Project Import",
            desc: "Import projects from Excel file"
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
        notfound: {
            message: "Page not found",
            return_home: "Return home"
        },
        inspection: {
            common: {
                back: "Back",
                loading: "Loading...",
                save: "Save",
                saving: "Saving...",
                cancel: "Cancel",
                error: "Error",
                success: "Success",
                not_found: "Inspection not found",
                load_error: "Unable to load inspection",
                update_success: "Inspection updated successfully",
                update_error: "Unable to update inspection",
                required_fields: "Please fill in all required fields",
                inspector_required: "Inspector *",
                inspector_placeholder: "Inspector's name",
                date_label: "Inspection date *",
                status_label: "Status",
                progress_label: "Progress (%)",
                comments_label: "Comments",
                comments_placeholder: "Your comments...",
                project_label: "Project"
            },
            status: {
                scheduled: "Scheduled",
                in_progress: "In Progress",
                approved: "Approved",
                rejected: "Rejected",
                requires_changes: "Requires Changes"
            },
            edit: {
                title: "Edit Inspection",
                description: "Edit inspection for project",
                in_development: "In development"
            },
            create: {
                title: "Create Inspection",
                description: "Create new inspection for project",
                in_development: "In development"
            },
            dialog: {
                new_inspection: "New inspection",
                title: "Site inspection",
                description: "Create a new inspection for the project",
                date: "Inspection date",
                select_date: "Select a date",
                inspector: "Inspector",
                inspector_placeholder: "Inspector's name",
                status: "Inspection status",
                select_status: "Select status",
                status_pending: "Pending",
                status_approved: "Approved",
                status_requires_changes: "Requires changes",
                status_rejected: "Rejected",
                progress: "Progress (%)",
                comments: "Comments",
                comments_placeholder: "Enter your remarks",
                cancel: "Cancel",
                create: "Create",
                creating: "Creating...",
                created: "Inspection created",
                created_description: "The inspection has been added successfully.",
                error: "Error",
                error_description: "An error occurred while creating the inspection.",
                validation_error: "Validation error",
                validation_inspector: "Inspector name is required."
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
        terms: {
            title: "Terms of Service",
            last_update: "Last updated: July 21, 2025",
            section1: {
                title: "1. Acceptance of Terms",
                text: "By accessing or using our software, whether as a SaaS or on-premise solution, you agree to be bound by these Terms of Service."
            },
            section2: {
                title: "2. SaaS Service Use",
                text: "Our SaaS platform is hosted in the cloud and accessed over the internet. You are responsible for maintaining the confidentiality of your account credentials and all activities under your account."
            },
            section3: {
                title: "3. On-Premise Deployment",
                text: "If you deploy our software on your own infrastructure (on-premise), you agree to comply with all installation, maintenance, and security guidelines provided by HadraTech. HadraTech is not responsible for issues arising from your environment or misuse."
            },
            section4: {
                title: "4. Cloud Hosting",
                text: "For SaaS users, our software is hosted on secure cloud infrastructure. We use industry-standard security practices to protect your data, but you acknowledge that no system is completely secure."
            },
            section5: {
                title: "5. License Grant",
                text: "HadraTech grants you a non-exclusive, non-transferable license to use the software according to the terms of your subscription or license agreement. You may not sublicense, rent, or lease the software."
            },
            section6: {
                title: "6. Restrictions",
                text: "You may not: reverse engineer, decompile, modify, or create derivative works from the software except as expressly permitted by law or with HadraTech’s written consent."
            },
            section7: {
                title: "7. Payment and Fees",
                text: "Use of the SaaS service is subject to payment of applicable subscription fees. On-premise licenses may require a one-time or recurring fee as outlined in your license agreement."
            },
            section8: {
                title: "8. Termination",
                text: "HadraTech may suspend or terminate your access if you breach these terms. Upon termination, your license to use the software ends and you must cease all use."
            },
            section9: {
                title: "9. Liability Limitation",
                text: "HadraTech is not liable for indirect or consequential damages arising from use or inability to use the software."
            },
            section10: {
                title: "10. Governing Law",
                text: "These Terms are governed by the laws of the jurisdiction where HadraTech is incorporated."
            },
            rights: "All rights reserved",
            by_hadratech: "Developed by HadraTech",
            about_desc: "Our construction management ERP system is designed to simplify and optimize all aspects of your construction projects."


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
                powered: "Comprehensive platform powered by HadraTech",
                login_to_access: "Login to access",
                register: "Create an account",
                management: "MATERIALS MANAGEMENT AND MONITORING OF PROJECTS",
                system: "Materials Management System and Monitoring of Project",
                message: "Promoting heritage with local materials",
                details: "Track your construction projects using Atar/Aioun stone, Nouakchott seashells, and Mauritanian clay. Our solution optimizes the management of construction projects, particularly with local materials, and preserves traditional techniques."

            },
            direction_features: {
    title: "Strategic Dashboards",
    description: "Investment steering and energy planning",
    powered: "Integrated Project Management, Powered by HadraTech",
    system: "Supervision system and decision support",
    details: "Visualize real-time performance indicators, plan infrastructure investments and optimize the distribution of energy resources across the national territory.",
    management: "Asset Management and Preventive Maintenance",
    message: "Monitoring and optimization of energy infrastructure"
},

consulting_features: {
    title: "Engineering and Project Studies",
    description: "Design and simulation of electrical networks",
    system: "Modeling and sizing platform",
    details: "Study the technical feasibility of projects, dimension distribution networks and simulate the impact of new energy infrastructures.",
    message: "Network optimization for efficient energy distribution",
    management: "Engineering Project Management",
    powered: "Integrated Project Management, Powered by HadraTech"
},

procurement_features: {
    title: "Supply Chain Management",
    description: "Optimization of energy purchases and stocks",
    system: "Equipment traceability system",
    details: "Manage calls for tender, track orders for transformers, cables and meters, and optimize stock levels to guarantee service continuity."
}
            ,
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
                started: "Started",
                end_date_expected: "Expected End Date",
                delete: "Delete",
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
                facilities_location: "Facilities Location",
                title_placeholder: "Enter project title",
                location_placeholder: "Select location",
                status_placeholder: "Select status",
                progress_desc: "Specify project progress as a percentage.",
                progress_current: "Current progress: {value}%",
                description_placeholder: "Describe the project..."
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
            // Administrative subcategories
            lettre_soumission: "Submission Letter",
            pouvoir_signature: "Signature Authority",
            acte_groupement: "Grouping Agreement",
            attestation_impot: "Tax Certificate",
            attestation_cnss: "Social Security Certificate",
            attestation_non_faillite: "Non-Bankruptcy Certificate",
            renseignement_soumissionnaire: "Bidder Information",
            // Planification (PAA) - Administrative
            plan_annuel_achats: "Annual Procurement Plan (PAA)",
            modele_paa: "Annual Procurement Plan Template",
            validation_ordonnateur: "Authorizing Officer Validation",
            publication_armp: "Publication on ARMP website",
            // Initiation - Administrative
            demande_initiation: "Procedure Initiation Request",
            procedure_proposee: "Proposed Procedure",
            // Sélection - Administrative
            consultation_directe: "Direct Consultation (≤ 600,000 MRU)",
            consultation_concurrentielle: "Competitive Consultation",
            lettre_consultation: "Consultation Letter (Document No. 1)",
            modele_soumission: "Submission Template (Document No. 2)",
            modele_contrat: "Contract Template (Document No. 4)",
            registre_reception_plis: "Bid Reception Register",
            recu_depot_plis: "Bid Deposit Receipt",
            pv_ouverture_plis: "Bid Opening Minutes",
            pv_evaluation_attribution: "Evaluation and Award Proposal Minutes",
            selection_consultants: "Consultant Selection",
            dossier_smc_sfqc_sci: "Standard File for SMC/SFQC/SCI",
            lettre_invitation: "Invitation Letter (Document No. 1)",
            // Attribution - Administrative
            lettre_notification: "Award Notification Letter",
            nom_attributaire: "Awardee Name",
            delai_execution: "Execution Period",
            publication_provisoire: "Provisional Publication (2 days for appeals)",
            signature_contrat: "Contract Signing",
            // Archivage - Administrative
            original_offres: "Original Bids",
            pv_archivage: "Opening and Evaluation Minutes",
            contrats_signes: "Signed Contracts",
            preuves_publication: "Publication Proofs",
            chemises_archivage: "Labeled Archive Folders or Boxes",
            double_numerique: "Digital Copy Recommended",
            // Technical subcategories
            preuves_capacites_techniques: "Technical Capacity Evidence (similar projects)",
            experience_generale_marche: "General Experience in Contract Subject",
            methodologie: "Methodology",
            personnel_cle: "Key Personnel",
            planning_travaux: "Work Schedule",
            calendrier_livraison: "Delivery Schedule",
            conformite_techniques: "Technical Compliance",
            // Initiation - Technical
            description_besoin: "Detailed Need Description",
            // Sélection - Technical
            ddqe: "Descriptive Quantitative Estimate - DDQE (Document No. 3)",
            termes_reference: "Terms of Reference - ToR (Document No. 3)",
            pv_evaluation_technique: "Technical and Financial Evaluation Minutes",
            // Financial subcategories
            preuves_capacites_financieres: "Financial Capacity Evidence",
            chiffre_affaires_annuel: "Average Annual Turnover of Activities",
            devis_quantitatif_estimatif: "Quantitative Estimate",
            garantie_bancaire: "Bank Guarantee",
            garantie_soumission: "Bid Guarantee for the Period",
            // Initiation - Financial
            source_financement: "Financing Source",
            montant_alloue: "Allocated Amount",
            // Sélection - Financial
            devis_comparatifs: "Comparative Quotes (3 minimum)",
            factures_commandes: "Invoices and Purchase Orders",
            // Attribution - Financial
            montant_marche: "Contract Amount"
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

    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        type Nested = Record<string, unknown>;
        let value: unknown = (translations as Record<string, Nested>)[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in (value as Nested)) {
                value = (value as Nested)[k];
            } else {
                console.warn(`Translation key "${key}" not found for language "${language}"`);
                return key;
            }
        }

        let result = typeof value === 'string' ? value : key;
        
        // Handle interpolation with params like {title}
        if (params && typeof result === 'string') {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
            });
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
