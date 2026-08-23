# Audit des libellés d'ENUM (fr / ar / en)

Généré par `scripts/enum-labels-gen.cjs` -> `src/config/referentials/i18n/enum-labels.referential.ts`.

Doctrine : l'ENUM porte le **code technique** unique (jamais traduit, persisté en base) ;
le référentiel porte les **libellés** fr/ar/en consommés par l'UI (`useEnumLabel`, `<EnumText>`, `<EnumBadge>`).

**38 ENUM — 285 codes traduits (fr/ar/en complets).**

## AuthProvider

| code technique | fr | ar | en |
|---|---|---|---|
| `supabase` | Supabase | سوبابيز | Supabase |
| `keycloak` | Keycloak | كيكلوك | Keycloak |
| `auth0` | Auth0 | أوث0 | Auth0 |
| `database` | Base de données | قاعدة بيانات | Database |

## AuthUserStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `active` | Actif | نشط | Active |
| `inactive` | Inactif | غير نشط | Inactive |
| `suspended` | Suspendu | معلق | Suspended |
| `pending` | En attente | قيد الانتظار | Pending |

## CommonStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `active` | Actif | نشط | Active |
| `inactive` | Inactif | غير نشط | Inactive |
| `pending` | En attente | قيد الانتظار | Pending |
| `completed` | Terminé | مكتمل | Completed |
| `cancelled` | Annulé | ملغى | Cancelled |
| `draft` | Brouillon | مسودة | Draft |

## DocumentPriority

| code technique | fr | ar | en |
|---|---|---|---|
| `low` | Basse | منخفضة | Low |
| `medium` | Moyenne | متوسطة | Medium |
| `high` | Haute | عالية | High |
| `urgent` | Urgent | عاجلة | Urgent |

## DocumentStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `draft` | Brouillon | مسودة | Draft |
| `pending_approval` | En attente d'approbation | بانتظار الموافقة | Pending Approval |
| `pending_review` | En attente de révision | قيد المراجعة | Pending Review |
| `approved` | Approuvé | معتمد | Approved |
| `rejected` | Rejeté | مرفوض | Rejected |
| `archived` | Archivé | مؤرشف | Archived |
| `expired` | Expiré | منتهي الصلاحية | Expired |
| `deprecated` | Obsolète | مُلغى | Deprecated |

## DocumentType

| code technique | fr | ar | en |
|---|---|---|---|
| `contract` | Contrat | عقد | Contract |
| `plan` | Plan | خطة | Plan |
| `specification` | Spécification | مواصفات | Specification |
| `report` | Rapport | تقرير | Report |
| `certificate` | Certificat | شهادة | Certificate |
| `permit` | Permis | تصريح | Permit |
| `invoice` | Facture | فاتورة | Invoice |
| `receipt` | Reçu | إيصال | Receipt |
| `manual` | Manuel | دليل | Manual |
| `policy` | Politique | سياسة | Policy |
| `procedure` | Procédure | إجراء | Procedure |
| `drawing` | Dessin | رسم | Drawing |
| `photo` | Photo | صورة | Photo |
| `video` | Vidéo | فيديو | Video |
| `blueprint` | Plan d'exécution | مخطط تنفيذي | Blueprint |
| `schema` | Schéma | مخطط بياني | Diagram |
| `checklist` | Liste de contrôle | قائمة تدقيق | Checklist |
| `form` | Formulaire | نموذج | Form |
| `template` | Modèle | قالب | Template |
| `pv` | PV | محضر | Minutes |
| `service_report` | Rapport de service | تقرير خدمة | Service Report |
| `tender_document` | Document d'appel d'offres | وثيقة مناقصة | Tender Document |
| `supporting_document` | Pièce justificative | وثيقة داعمة | Supporting Document |
| `correspondence` | Correspondance | مراسلات | Correspondence |
| `insurance` | Assurance | تأمين | Insurance |
| `warranty` | Garantie | ضمان | Warranty |
| `bank_guarantee` | Garantie bancaire | ضمان بنكي | Bank Guarantee |
| `other` | Autre | أخرى | Other |

## EmployeeDepartment

| code technique | fr | ar | en |
|---|---|---|---|
| `engineering` | Ingénierie | هندسة | Engineering |
| `design` | Conception | تصميم | Design |
| `project_management` | Gestion de projet | إدارة المشاريع | Project Management |
| `quality_assurance` | Assurance qualité | ضمان الجودة | Quality Assurance |
| `operations` | Opérations | عمليات | Operations |
| `finance` | Finance | مالية | Finance |
| `human_resources` | Ressources humaines | موارد بشرية | Human Resources |
| `marketing` | Marketing | تسويق | Marketing |
| `sales` | Ventes | مبيعات | Sales |
| `administration` | Administration | إدارة | Administration |
| `legal` | Juridique | شؤون قانونية | Legal |
| `procurement` | Achats | مشتريات | Procurement |
| `maintenance` | Maintenance | صيانة | Maintenance |
| `security` | Sécurité | أمن | Security |

## EmployeeRole

| code technique | fr | ar | en |
|---|---|---|---|
| `project_manager` | Chef de projet | مدير مشروع | Project Manager |
| `team_lead` | Chef d'équipe | رئيس فريق | Team Lead |
| `developer` | Développeur | مطور | Developer |
| `designer` | Designer | مصمم | Designer |
| `analyst` | Analyste | محلل | Analyst |
| `tester` | Testeur | فاحص | Tester |
| `architect` | Architecte | مهندس معماري | Architect |
| `consultant` | Consultant | مستشار | Consultant |
| `specialist` | Spécialiste | أخصائي | Specialist |
| `coordinator` | Coordinateur | منسق | Coordinator |
| `supervisor` | Superviseur | مشرف | Supervisor |
| `manager` | Manager | مدير | Manager |

## EmployeeStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `active` | Actif | فعّال | Active |
| `inactive` | Inactif | غير فعّال | Inactive |
| `on_leave` | En congé | في إجازة | On Leave |
| `terminated` | Licencié | مُنهى خدماته | Terminated |
| `suspended` | Suspendu | موقوف | Suspended |

## EmployeeType

| code technique | fr | ar | en |
|---|---|---|---|
| `full_time` | Temps plein | دوام كامل | Full-Time |
| `part_time` | Temps partiel | دوام جزئي | Part-Time |
| `contract` | Contractuel | عقد | Contract |
| `intern` | Stagiaire | متدرب | Intern |
| `consultant` | Consultant | مستشار | Consultant |

## InspectionPriority

| code technique | fr | ar | en |
|---|---|---|---|
| `low` | Faible | منخفضة | Low |
| `medium` | Moyenne | متوسطة | Medium |
| `high` | Élevée | عالية | High |
| `urgent` | Urgente | عاجلة | Urgent |

## InspectionStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `scheduled` | Programmé | مجدولة | Scheduled |
| `pending` | En attente | معلقة | Pending |
| `planned` | Planifié | مخطط لها | Planned |
| `in_progress` | En cours | قيد التنفيذ | In Progress |
| `completed` | Terminé | مكتملة | Completed |
| `requires_review` | Requiert révision | تتطلب مراجعة | Requires Review |
| `requires_changes` | À modifier | يتطلب تعديلات | Requires Changes |
| `approved` | Approuvée | معتمدة | Approved |
| `rejected` | Rejetée | مرفوضة | Rejected |
| `cancelled` | Annulée | ملغاة | Cancelled |

## InspectionType

| code technique | fr | ar | en |
|---|---|---|---|
| `routine` | Régulière | روتينية | Routine |
| `special` | Spéciale | خاصة | Special |
| `safety` | Sécurité | سلامة | Safety |
| `quality` | Qualité | جودة | Quality |
| `compliance` | Conformité | امتثال | Compliance |

## MaterialStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `available` | Disponible | متوفر | Available |
| `out_of_stock` | En rupture de stock | نفد المخزون | Out of Stock |
| `discontinued` | Arrêté | متوقف | Discontinued |
| `on_order` | En commande | قيد الطلب | On Order |
| `reserved` | Réservé | محجوز | Reserved |
| `damaged` | Endommagé | تالف | Damaged |

## MaterialUnit

| code technique | fr | ar | en |
|---|---|---|---|
| `pieces` | Pièces | قطعة | Pieces |
| `kilograms` | Kilogrammes | كيلوغرام | Kilograms |
| `meters` | Mètres | متر | Meters |
| `liters` | Litres | لتر | Liters |
| `square_meters` | Mètres carrés | متر مربع | Square Meters |
| `cubic_meters` | Mètres cubes | متر مكعب | Cubic Meters |
| `tons` | Tonnes | طن | Tons |
| `bags` | Sacs | كيس | Bags |
| `boxes` | Boîtes | صندوق | Boxes |
| `rolls` | Rouleaux | لفة | Rolls |
| `sets` | Lots | طقم | Sets |

## PaymentStatusEnum

| code technique | fr | ar | en |
|---|---|---|---|
| `pending` | En attente | قيد الانتظار | Pending |
| `approved` | Approuvé | معتمد | Approved |
| `processed` | Traité | معالج | Processed |
| `completed` | Terminé | مكتمل | Completed |
| `failed` | Échoué | فاشل | Failed |
| `blocked` | Bloqué | محظور | Blocked |
| `rejected` | Rejeté | مرفوض | Rejected |
| `cancelled` | Annulé | ملغى | Canceled |

## PhasePriority

| code technique | fr | ar | en |
|---|---|---|---|
| `low` | Faible | منخفضة | Low |
| `medium` | Moyenne | متوسطة | Medium |
| `high` | Élevée | عالية | High |
| `urgent` | Urgente | عاجلة | Urgent |

## PhaseStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `pending` | En attente | قيد الانتظار | Pending |
| `in_progress` | En cours | قيد الإنجاز | In Progress |
| `completed` | Terminée | مكتملة | Completed |
| `delayed` | Retardée | متأخرة | Delayed |
| `cancelled` | Annulée | ملغاة | Cancelled |

## PhaseType

| code technique | fr | ar | en |
|---|---|---|---|
| `foundation` | Fondations | أساسات | Foundation |
| `structural` | Structurel | إنشاء الهيكل | Structural |
| `excavation` | Excavation | حفريات | Excavation |
| `demolition` | Démolition | هدم | Demolition |
| `finishing` | Finition | تشطيبات | Finishing |
| `electrical` | Électricité | كهرباء | Electrical |
| `plumbing` | Plomberie | سباكة | Plumbing |
| `hvac` | Climatisation | تكييف وتهوية | HVAC |
| `roofing` | Toiture | تسقيف | Roofing |
| `exterior` | Extérieur | أعمال خارجية | Exterior |
| `interior` | Intérieur | أعمال داخلية | Interior |
| `landscaping` | Aménagement paysager | تنسيق مواقع | Landscaping |

## PhaseWorkflowStep

| code technique | fr | ar | en |
|---|---|---|---|
| `planning` | Planification | تخطيط | Planning |
| `execution` | Exécution | تنفيذ | Execution |
| `review` | Revue | مراجعة | Review |
| `completion` | Achèvement | إتمام | Completion |

## Priority

| code technique | fr | ar | en |
|---|---|---|---|
| `low` | Basse | منخفضة | Low |
| `medium` | Moyenne | متوسطة | Medium |
| `high` | Haute | عالية | High |
| `urgent` | Urgente | مستعجلة | Urgent |

## ProfileStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `active` | Actif | نشط | Active |
| `inactive` | Inactif | غير نشط | Inactive |
| `suspended` | Suspendu | معلق | Suspended |
| `pending_verification` | Vérification en attente | بانتظار التحقق | Pending Verification |

## ProjectStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `draft` | Brouillon | مسودة | Draft |
| `planned` | Planifié | مخطط | Planned |
| `pre_qualification` | Pré-qualification | تأهيل مبدئي | Pre-Qualification |
| `en_attente` | En attente | قيد الانتظار | On Hold |
| `en_conception` | En conception | قيد التصميم | In Design |
| `planifie_v2` | Planifié | مخطط | Planned |
| `attribue_v2` | Attribué | مُسند | Assigned |
| `en_cours_v2` | En cours | قيد التنفيذ | In Progress |
| `en_construction_v2` | En construction | قيد الإنشاء | Under Construction |
| `en_inspection_v2` | En inspection | تحت الفحص | Under Inspection |
| `en_review` | En révision | قيد المراجعة | Under Review |
| `termine_v2` | Terminé | منتهٍ | Completed |
| `en_cloture_v2` | En clôture | قيد الإغلاق | Closing |
| `completed` | Terminé | مكتمل | Completed |
| `suspendu_v2` | Suspendu | معلق | Suspended |
| `en_retard_v2` | En retard | متأخر | Delayed |
| `annule_v2` | Annulé | ملغى | Canceled |
| `cancelled` | Annulé | ملغى | Canceled |
| `enCours` | En cours | قيد التنفيذ | In Progress |
| `termine` | Terminé | منتهٍ | Completed |
| `enAttente` | En attente | قيد الانتظار | Pending |
| `enInspection` | En inspection | تحت الفحص | Under Inspection |
| `suspendu` | Suspendu | معلق | Suspended |
| `annule` | Annulé | ملغى | Canceled |
| `attribue` | Attribué | مُسنَد | Awarded |
| `planifie` | Planifié | مخطط له | Planned |
| `preQualification` | Pré-qualification | تأهيل مبدئي | Prequalification |
| `enConception` | En conception | قيد التصميم | In Design |
| `enConstruction` | En construction | قيد الإنشاء | Under Construction |
| `enCloture` | En clôture | قيد الإغلاق | Closing |
| `enRetard` | En retard | متأخر | Delayed |

## ProjectType

| code technique | fr | ar | en |
|---|---|---|---|
| `residential` | Résidentiel | سكني | Residential |
| `commercial` | Commercial | تجاري | Commercial |
| `industrial` | Industriel | صناعي | Industrial |
| `infrastructure` | Infrastructure | بنية تحتية | Infrastructure |
| `renovation` | Rénovation | تجديد | Renovation |
| `maintenance` | Maintenance | صيانة | Maintenance |

## ReceptionStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `pending` | En attente | قيد الانتظار | Pending |
| `in_progress` | En cours | قيد التقدم | In Progress |
| `approved` | Approuvé | معتمد | Approved |
| `rejected` | Rejeté | مرفوض | Rejected |
| `require_resubmission` | À soumettre à nouveau | يتطلب إعادة تقديم | Resubmission Required |

## ReceptionType

| code technique | fr | ar | en |
|---|---|---|---|
| `provisional` | Provisoire | مؤقت | Provisional |
| `definitive` | Définitive | نهائي | Definitive |

## RiskCategory

| code technique | fr | ar | en |
|---|---|---|---|
| `technical` | Technique | فني | Technical |
| `financial` | Financier | مالي | Financial |
| `operational` | Opérationnel | تشغيلي | Operational |
| `strategic` | Stratégique | استراتيجي | Strategic |
| `compliance` | Conformité | امتثال | Compliance |
| `safety` | Sécurité | سلامة | Safety |

## RiskLevel

| code technique | fr | ar | en |
|---|---|---|---|
| `low` | Faible | منخفض | Low |
| `medium` | Moyen | متوسط | Medium |
| `high` | Élevé | مرتفع | High |
| `critical` | Critique | حرج | Critical |

## RiskStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `identified` | Identifié | محدد | Identified |
| `monitored` | Suivi | مراقب | Monitored |
| `mitigated` | Maîtrisé | مسيطر عليه | Mitigated |
| `resolved` | Résolu | تم حله | Resolved |
| `accepted` | Accepté | مقبول | Accepted |

## StakeholderEntityType

| code technique | fr | ar | en |
|---|---|---|---|
| `person` | Personne | شخص | Person |
| `organization` | Organisation | مؤسسة | Organization |
| `department` | Département | إدارة | Department |
| `team` | Équipe | فريق | Team |

## StakeholderRole

| code technique | fr | ar | en |
|---|---|---|---|
| `project_manager` | Chef de projet | مدير المشروع | Project Manager |
| `team_lead` | Chef d'équipe | قائد الفريق | Team Lead |
| `developer` | Développeur | مطور | Developer |
| `designer` | Concepteur | مصمم | Designer |
| `analyst` | Analyste | محلل | Analyst |
| `tester` | Testeur | مختبر | Tester |
| `architect` | Architecte | مهندس معماري | Architect |
| `consultant` | Consultant | استشاري | Consultant |
| `sponsor` | Sponsor | راعي | Sponsor |
| `client` | Client | عميل | Client |
| `vendor` | Fournisseur | مورد | Vendor |
| `contractor` | Entrepreneur | مقاول | Contractor |
| `stakeholder` | Partie prenante | صاحب مصلحة | Stakeholder |

## StakeholderType

| code technique | fr | ar | en |
|---|---|---|---|
| `employee` | Employé | موظف | Employee |
| `external` | Externe | خارجي | External |
| `principal_contractor` | Entreprise principale | مقاول رئيسي | Principal Contractor |
| `client` | Client | عميل | Client |
| `vendor` | Fournisseur | مورد | Vendor |
| `partner` | Partenaire | شريك | Partner |
| `regulator` | Régulateur | جهة تنظيمية | Regulator |
| `investor` | Investisseur | مستثمر | Investor |

## TaskPriority

| code technique | fr | ar | en |
|---|---|---|---|
| `low` | Basse | منخفضة | Low |
| `medium` | Moyenne | متوسطة | Medium |
| `high` | Haute | عالية | High |
| `urgent` | Urgente | مستعجلة | Urgent |

## TaskStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `pending` | En attente | قيد الانتظار | Pending |
| `in_progress` | En cours | قيد التقدم | In Progress |
| `blocked` | Bloquée | متوقفة | Blocked |
| `completed` | Terminée | مكتملة | Completed |
| `cancelled` | Annulée | ملغاة | Cancelled |

## TaskType

| code technique | fr | ar | en |
|---|---|---|---|
| `general` | Générale | عامة | General |
| `inspection` | Inspection | معاينة | Inspection |
| `document` | Document | وثيقة | Document |
| `payment` | Paiement | دفعة | Payment |
| `material` | Matériel | مواد | Material |
| `study` | Étude | دراسة | Study |
| `execution` | Exécution | تنفيذ | Execution |

## UserRoleStatus

| code technique | fr | ar | en |
|---|---|---|---|
| `active` | Actif | نشط | Active |
| `inactive` | Inactif | غير نشط | Inactive |
| `revoked` | Révoqué | ملغاة | Revoked |
| `pending` | En attente | قيد الانتظار | Pending |

## ValidationCategory

| code technique | fr | ar | en |
|---|---|---|---|
| `technical` | Technique | فني | Technical |
| `financial` | Financière | مالي | Financial |
| `regulatory` | Réglementaire | تنظيمي | Regulatory |
| `safety` | Sécurité | سلامة | Safety |
| `quality` | Qualité | جودة | Quality |
| `environmental` | Environnementale | بيئي | Environmental |
| `documentation` | Documentation | وثائقي | Documentation |
| `reception` | Réception | استلام | Acceptance |
| `risk` | Risque | مخاطر | Risk |
| `compliance` | Conformité | امتثال | Compliance |

## WorkflowMode

| code technique | fr | ar | en |
|---|---|---|---|
| `create` | Création | إنشاء | Create |
| `edit` | Modification | تعديل | Edit |
| `complete` | Finalisation | إنجاز | Complete |
| `cancel` | Annulation | إلغاء | Cancel |
