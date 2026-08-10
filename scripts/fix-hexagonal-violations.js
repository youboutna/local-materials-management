#!/usr/bin/env node
/**
 * 🧠 HEXAGONAL ARCHITECTURE ANALYZER & SEMANTIC CODE QUALITY ENFORCER (v31)
 *
 * PRIORITÉS P0 (CRITIQUES) :
 *   1. Corps de méthode non finalisé (TODO, NotImplemented, vide)
 *   2. Appels Supabase directs dans l'UI (components, pages)
 *   3. Types 'any' dans le code
 *   4. Violations d'architecture hexagonale
 *
 * Utilisation :
 *   node fix-hexagonal-violations.js [--fix] [--interactive] [--move-types] [--dry-run]
 *                         [--json] [--output file] [--ts-check] [--clean-mocks]
 *                         [--scoring] [--consolidate-duplicates] [--semantic-analysis]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURATION ARCHITECTURE HEXAGONALE
// ==========================================

const ARCHITECTURE = {
  layers: {
    UI: {
      paths: ['src/components/', 'src/pages/'],
      allowed: ['hooks/ui', 'components', 'pages', 'contexts'],
      forbidden: ['application', 'domain', 'infrastructure'],
      description: 'Composants React, pages, hooks UI'
    },
    APPLICATION: {
      paths: ['src/application/'],
      allowed: ['services', 'transformers', 'dtos'],
      forbidden: ['components', 'pages', 'infrastructure'],
      description: 'Services métier, cas d\'usage, orchestration'
    },
    DOMAIN: {
      paths: ['src/domain/'],
      allowed: ['entities', 'repositories', 'events', 'value-objects'],
      forbidden: ['components', 'pages', 'infrastructure', 'application'],
      description: 'Entités métier pures, règles, interfaces'
    },
    INFRASTRUCTURE: {
      paths: ['src/infrastructure/'],
      allowed: ['adapters', 'clients', 'config', 'external'],
      forbidden: ['components', 'pages', 'domain'],
      description: 'Implémentations techniques, adaptateurs'
    },
    DTOS: {
      paths: ['src/dtos/'],
      allowed: ['entities', 'workflows', 'transforms', 'types'],
      forbidden: ['components', 'pages', 'infrastructure'],
      description: 'Data Transfer Objects et Transformers'
    },
    HOOKS: {
      paths: ['src/hooks/'],
      allowed: ['hexagonal', 'ui'],
      forbidden: ['components', 'pages', 'infrastructure'],
      description: 'Hooks React (hexagonaux et UI)'
    }
  },
  
  fileTypes: {
    entity: {
      pattern: /src\/domain\/entities\/.*\.ts$/,
      score: 100,
      category: 'ENTITY',
      description: 'Entité métier pure'
    },
    repository: {
      pattern: /src\/domain\/repositories\/I.*\.ts$/,
      score: 95,
      category: 'REPOSITORY_INTERFACE',
      description: 'Interface de repository (port)'
    },
    dto: {
      pattern: /src\/dtos\/.*DTO\.ts$/,
      score: 90,
      category: 'DTO',
      description: 'Data Transfer Object'
    },
    transformer: {
      pattern: /src\/dtos\/transforms\/.*\.ts$/,
      score: 85,
      category: 'TRANSFORMER',
      description: 'Mapper entre domain et DTO'
    },
    service: {
      pattern: /src\/application\/services\/.*Service\.ts$/,
      score: 80,
      category: 'SERVICE',
      description: 'Service métier application'
    },
    adapter: {
      pattern: /src\/infrastructure\/.*Adapter\.ts$/,
      score: 75,
      category: 'ADAPTER',
      description: 'Adaptateur infrastructure'
    },
    hook: {
      pattern: /src\/hooks\/(hexagonal|ui)\/.*\.ts$/,
      score: 70,
      category: 'HOOK',
      description: 'Hook React hexagonal'
    },
    component: {
      pattern: /src\/components\/.*\.tsx$/,
      score: 50,
      category: 'COMPONENT',
      description: 'Composant React UI'
    },
    page: {
      pattern: /src\/pages\/.*\.tsx$/,
      score: 50,
      category: 'PAGE',
      description: 'Page React'
    },
    legacy: {
      pattern: /src\/(services|types|utils)\/.*\.ts$/,
      score: 20,
      category: 'LEGACY',
      description: 'Fichier legacy à migrer'
    }
  },
  
  dependencyRules: [
    { from: 'UI', to: 'APPLICATION', allowed: true },
    { from: 'UI', to: 'DOMAIN', allowed: true },
    { from: 'UI', to: 'DTOS', allowed: true },
    { from: 'UI', to: 'HOOKS', allowed: true },
    { from: 'UI', to: 'INFRASTRUCTURE', allowed: false },
    { from: 'APPLICATION', to: 'DOMAIN', allowed: true },
    { from: 'APPLICATION', to: 'DTOS', allowed: true },
    { from: 'APPLICATION', to: 'INFRASTRUCTURE', allowed: false },
    { from: 'DOMAIN', to: 'APPLICATION', allowed: false },
    { from: 'DOMAIN', to: 'INFRASTRUCTURE', allowed: false },
    { from: 'DOMAIN', to: 'DTOS', allowed: false },
    { from: 'INFRASTRUCTURE', to: 'DOMAIN', allowed: true },
    { from: 'INFRASTRUCTURE', to: 'APPLICATION', allowed: true },
    { from: 'DTOS', to: 'DOMAIN', allowed: true },
    { from: 'HOOKS', to: 'APPLICATION', allowed: true },
    { from: 'HOOKS', to: 'DOMAIN', allowed: true },
    { from: 'HOOKS', to: 'DTOS', allowed: true },
    { from: 'HOOKS', to: 'INFRASTRUCTURE', allowed: false }
  ]
};

// ==========================================
// RÈGLES AVEC PRIORITÉS P0
// ==========================================

const RULES = {
  // ============================================================
  // P0 - CRITIQUE : Corps de méthode non finalisé
  // ============================================================
  MISSING_IMPLEMENTATION: {
    id: 'P0-M001', 
    priority: 0, 
    severity: 'ERROR',
    pattern: null,
    message: '🚨 [P0-M001] Corps de méthode non finalisé (TODO/NotImplemented/vide).',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/', '.spec.', '.test.'],
    check: (content) => {
      // Fonctions nommées dont le corps est vide (on ignore les callbacks inline `(() => {})`)
      const emptyFuncs = (
        content.match(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:function\s+\w+\s*\([^)]*\)|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?=>)\s*{\s*}/g) || []
      ).length;
      const todoComments = (content.match(/\/\/\s*TODO\s*[:=]/gi) || []).length;
      const notImpl = (content.match(/throw\s+new\s+Error\(['"`](?:Not implemented|TODO|Not implemented yet).*?['"`]\)/gi) || []).length;
      return {
        emptyFunctions: emptyFuncs,
        todoComments: todoComments,
        notImplemented: notImpl,
        total: emptyFuncs + todoComments + notImpl
      };
    }

  },

  // ============================================================
  // P0 - CRITIQUE : Appels Supabase directs dans l'UI
  // ============================================================
  DB_IN_COMPONENT: {
    id: 'P0-DB001', 
    priority: -1, 
    severity: 'ERROR', 
    target: 'UI',
    pattern: /(?:await\s+)?(?:supabase|db|database)\.\w+\(/g,
    message: '🚨 [P0-DB001] Appel base de données direct dans composant UI ! Utiliser repository pattern via service + hook.',
    isAutoFixable: false,
    exclude: ['src/hooks/', 'src/application/', 'src/infrastructure/', 'src/dtos/', 'src/domain/'],
    fixSuggestion: 'Déplacer la logique dans un service et utiliser use[Entity]Hex()'
  },

  // ============================================================
  // P0 - CRITIQUE : 'any' type
  // ============================================================
  ANY_TYPE: {
    id: 'P0-ANY001', 
    priority: -1, 
    severity: 'ERROR',
    pattern: /:\s*any\b/g,
    message: '🚨 [P0-ANY001] Type "any" interdit ! Définir un type ou interface approprié.',
    isAutoFixable: false, 
    exclude: ['node_modules/', 'dist/', 'build/', 'src/test/'],
    fixSuggestion: 'Utiliser unknown puis affiner avec type guard, ou définir interface dédiée'
  },

  // ============================================================
  // P0 - ARCHITECTURE : Appels Supabase directs (partout)
  // ============================================================
  DIRECT_SUPABASE: {
    id: 'P0-SUP001', 
    priority: -1, 
    severity: 'ERROR',
    pattern: /supabase\.(?:from\(['"]([^'"]+)['"]\)\.(?:select|insert|update|delete|upsert|eq|neq|in|order|limit|single|maybeSingle)|rpc\(['"]([^'"]+)['"]|functions\.invoke\(['"]([^'"]+)['"]|channel\(['"]([^'"]+)['"])/g,
    message: '🚨 [P0-SUP001] Appel Supabase direct détecté ! Utiliser Repository pattern via adapters.',
    isAutoFixable: false,
    exclude: ['src/infrastructure/', 'src/integrations/'],
    contextMap: {
      'materials': 'IMaterialRepository → SupabaseMaterialAdapter',
      'projects': 'IProjectRepository → SupabaseProjectAdapter',
      'inspections': 'IInspectionRepository → SupabaseInspectionAdapter',
      'users': 'IUserRepository → SupabaseUserAdapter',
      'tenders': 'ITenderRepository → SupabaseTenderAdapter',
      'payments': 'IPaymentRepository → SupabasePaymentAdapter',
      'documents': 'IDocumentRepository → SupabaseDocumentAdapter',
      'notifications': 'INotificationRepository → SupabaseNotificationAdapter'
    }
  },

  // ============================================================
  // P1 - HAUTE PRIORITÉ : Types hors domain/dtos
  // ============================================================
  TYPE_DEFINITION_LOCATION: {
    id: 'P1-TYP001', 
    priority: 1, 
    severity: 'ERROR',
    pattern: /(?:^|\n)\s*export\s+(interface|type|enum)\s+([A-Z]\w*)/gm,
    message: '❌ [P1-TYP001] Type défini hors domain/dtos ! Déplacer vers src/dtos/entities/ ou src/domain/entities/.',
    isAutoFixable: false,
    exclude: ['src/config/', 'src/integrations/supabase/types.ts'],
    checkFile: fp => {
      const n = fp.replace(/\\/g, '/');
      if (n.includes('/components/') || n.includes('/pages/')) {
        return !n.includes('/domain/') && !n.includes('/dtos/');
      }
      return !n.includes('/domain/') && !n.includes('/dtos/');
    }
  },

  // ============================================================
  // P1 - HAUTE PRIORITÉ : Transform functions mal placées
  // ============================================================
  TRANSFORM_FUNCTION_LOCATION: {
    id: 'P1-TRF001', 
    priority: 1, 
    severity: 'ERROR',
    pattern: /(?:function\s+|const\s+|let\s+|var\s+)(fromRow|toRow|fromSupabase|toSupabase|mapFromDB|mapToDB|fromDb|toDb)\b/g,
    message: '❌ [P1-TRF001] Fonction de mapping hors dtos/transforms !',
    isAutoFixable: false,
    checkFile: fp => !fp.replace(/\\/g, '/').includes('/dtos/transforms/')
  },

  // ============================================================
  // P1 - HAUTE PRIORITÉ : Transformers incomplets
  // ============================================================
  TRANSFORMER_COMPLETENESS: {
    id: 'P1-TRF002', 
    priority: 1, 
    severity: 'WARNING',
    pattern: /class\s+(\w+)Transformer\s*{([^}]*)}/gs,
    message: '⚠️ [P1-TRF002] Transformer incomplet - méthodes manquantes.',
    isAutoFixable: false,
    check: (c) => {
      const methods = ['fromSupabase', 'toSupabase', 'toDTO', 'fromDTO'];
      const missing = methods.filter(m => !c.includes(m));
      return missing.length > 0 ? `Missing: ${missing.join(', ')}` : null;
    },
    exclude: ['src/test/']
  },

  // ============================================================
  // P2 - MOYENNE PRIORITÉ : Snake_case
  // ============================================================
  SNAKE_CASE_IDENTIFIER: {
    id: 'P2-CAS001', 
    priority: 2, 
    severity: 'WARNING',
    pattern: /\b([a-z]+_[a-z]+(?:_[a-z]+)*)\b/g,
    message: '⚠️ [P2-CAS001] Identifiant snake_case détecté (préférer camelCase).',
    isAutoFixable: true,
    fix: (m) => m.replace(/_([a-z])/g, (_, l) => l.toUpperCase()),
    exclude: ['src/infrastructure/', 'src/dtos/transforms/', 'src/test/', 'src/integrations/supabase/types.ts', 'supabase/'],
    skipIfInStringOrComment: true,
    skipIfObjectKey: true
  },

  // ============================================================
  // P2 - MOYENNE PRIORITÉ : DTO snake_case
  // ============================================================
  DTO_SNAKE_CASE: {
    id: 'P2-CAS002', 
    priority: 1, 
    severity: 'ERROR',
    pattern: /interface\s+\w+DTO\s*{([^}]*?)(\w+_\w+)/g,
    message: '❌ [P2-CAS002] Snake_case dans DTO ! Utiliser camelCase.',
    isAutoFixable: true,
    fix: (m, _, field) => m.replace(field, field.replace(/_([a-z])/g, (_, l) => l.toUpperCase()))
  },

  // ============================================================
  // LEGACY (à migrer)
  // ============================================================
  LEGACY_SERVICES: {
    id: 'L001', priority: 1, severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/services\/([^'"]+)['"]/g,
    message: '❌ [L001] Import service legacy → utiliser @/application/services/',
    isAutoFixable: true, 
    fix: (m) => m.replace(/@\/services\//g, '@/application/services/')
  },
  LEGACY_TYPES: {
    id: 'L002', priority: 1, severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/types\/([^'"]+)['"]/g,
    message: '❌ [L002] Import types legacy → utiliser @/dtos/entities/',
    isAutoFixable: true, 
    fix: (m) => m.replace(/@\/types\//g, '@/dtos/entities/')
  },
  LEGACY_SERVICE_REF: {
    id: 'L003', priority: 1, severity: 'ERROR',
    pattern: /new\s+(\w+Service)\(/g,
    message: '❌ [L003] Instanciation service legacy → utiliser RepositoryFactory',
    isAutoFixable: false, 
    exclude: ['src/application/', 'src/infrastructure/']
  },
  NON_HEX_HOOK: {
    id: 'L004', priority: 1, severity: 'WARNING',
    pattern: /export\s+function\s+use(\w+)\(/g,
    message: '⚠️ [L004] Hook non hexagonal → ajouter "Hex" au nom ou déplacer.',
    isAutoFixable: true,
    fix: (m, name) => name.endsWith('Hex') ? m : m.replace(/use(\w+)\(/, (_, n) => `use${n}Hex(`),
    exclude: ['useProjectsHex', 'useProjectWorkflowHex', 'useProjectEditHex', 'usePhasesHex']
  },

  // ============================================================
  // MOCKS (à supprimer)
  // ============================================================
  HARDCODED_MOCK_STORE: {
    id: 'M001', priority: 0, severity: 'ERROR',
    pattern: /(?:const|let|var)\s+(\w*(?:mock|fake|stub|dummy|hardcoded)\w*)\s*[:=]/gi,
    message: '❌ [M001] Données mock/hardcodées dans le code !',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/', '.spec.', '.test.', 'node_modules/']
  },
  MOCK_CORE_LOGIC: {
    id: 'M002', priority: 0, severity: 'ERROR',
    pattern: /\/\/\s*(?:Mock|Hardcoded|Stub|Fake|Temporary|Placeholder|Replace|TODO: implement|TODO: replace)/gi,
    message: '❌ [M002] Commentaires mock/hardcodés !',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/']
  },
  STATIC_MOCK_DATA: {
    id: 'M003', priority: 0, severity: 'WARNING',
    pattern: /(?:const|let|var)\s+(\w*(?:mock|fake|dummy|sample|stub)\w*)\s*[:=]/gi,
    message: '⚠️ [M003] Données mock suspectes.',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/', 'src/config/', 'src/domain/', 'src/dtos/'],
    check: (content, varName) => {
      if (!/(mock|fake|dummy|sample|stub)/i.test(varName)) return null;
      return `Identifier "${varName}" looks like mock data.`;
    }
  },

  // ============================================================
  // DUPLICATES
  // ============================================================
  DUPLICATE_TYPE: {
    id: 'D001', priority: 2, severity: 'ERROR',
    message: '❌ [D001] Type dupliqué trouvé !',
    isAutoFixable: true
  }
};

const GENERIC_NAMES = new Set([
  'return', 'void', 'any', 'never', 'unknown', 'string', 'number', 'boolean', 'object', 'symbol', 'undefined', 'null', 'true', 'false',
  'class', 'interface', 'type', 'enum', 'namespace', 'module', 'import', 'export', 'default',
  'data', 'request', 'response', 'input', 'output', 'form', 'dto', 'entity',
  'create', 'update', 'delete', 'get', 'set', 'fetch', 'remove', 'add',
  'props', 'state', 'context', 'config', 'params', 'options', 'values', 'list', 'info', 'details'
]);

const REACT_PROP_INDICATORS = /\b(children|className|style|key|ref|on[A-Z]\w*)\s*[?:]/i;

const DOMAIN_MAP = {
  'PersistedDevSession': 'Auth',
  'UserSession': 'Auth',
  'AuthPayload': 'Auth',
  'KanbanTask': 'TaskAssignment',
  'TaskFormData': 'TaskAssignment',
  'OpenStreetMapResponse': 'Location',
  'MapResponse': 'Location',
  'MilestoneFormData': 'Milestone',
  'CreateMilestoneRequestDto': 'Milestone',
  'UpdateMilestoneRequestDto': 'Milestone',
  'MilestoneStatsDto': 'Milestone',
  'CheckpointVerificationResultDTO': 'Milestone'
};

const KEYWORD_DOMAIN_HINTS = [
  { keywords: ['map', 'geocode', 'location', 'address', 'place', 'coordinate', 'lat', 'lon'], domain: 'Location' },
  { keywords: ['notification', 'alert', 'email'], domain: 'Notification' },
  { keywords: ['payment', 'invoice', 'bill', 'transaction', 'accounting'], domain: 'Payment' },
  { keywords: ['tender', 'bid', 'procurement', 'submission', 'lot'], domain: 'Tender' },
  { keywords: ['task', 'assignment', 'todo', 'work'], domain: 'TaskAssignment' },
  { keywords: ['milestone', 'checkpoint', 'verification'], domain: 'Milestone' },
  { keywords: ['risk', 'hazard', 'assessment'], domain: 'Risk' },
  { keywords: ['inspection', 'audit', 'check'], domain: 'Inspection' },
  { keywords: ['material', 'resource', 'supply', 'inventory', 'stock'], domain: 'Material' },
  { keywords: ['document', 'file', 'attachment'], domain: 'Document' },
  { keywords: ['supplier', 'vendor', 'contractor'], domain: 'Supplier' },
  { keywords: ['employee', 'staff', 'personnel', 'worker'], domain: 'Employee' },
  { keywords: ['user', 'auth', 'session', 'profile', 'login'], domain: 'Auth' },
  { keywords: ['phase', 'stage', 'step'], domain: 'Phase' },
  { keywords: ['project', 'site', 'construction'], domain: 'Project' },
  { keywords: ['organization', 'company', 'entity'], domain: 'Organization' },
  { keywords: ['compliance', 'regulation'], domain: 'Compliance' },
  { keywords: ['monitoring', 'tracking'], domain: 'Monitoring' },
  { keywords: ['insurance', 'coverage'], domain: 'Insurance' },
  { keywords: ['bank', 'guarantee', 'bond'], domain: 'BankGuarantee' },
  { keywords: ['report', 'dashboard', 'statistics', 'analytics'], domain: 'Report' },
  { keywords: ['workspace', 'environment'], domain: 'Workspace' },
  { keywords: ['hierarchy', 'orgchart'], domain: 'Hierarchy' },
  { keywords: ['stakeholder', 'interested'], domain: 'Stakeholder' },
  { keywords: ['mission', 'expense', 'travel'], domain: 'MissionExpense' },
  { keywords: ['tender_sharing', 'sharing'], domain: 'TenderSharing' },
  { keywords: ['quantity', 'takeoff', 'measurement'], domain: 'QuantityTakeoff' },
  { keywords: ['load_data', 'import'], domain: 'LoadData' },
  { keywords: ['project_form', 'form'], domain: 'ProjectForm' },
  { keywords: ['parsed_invoice', 'parse'], domain: 'ParsedInvoice' },
  { keywords: ['inspection_execution', 'execution'], domain: 'InspectionExecution' },
  { keywords: ['inspection_scheduling', 'schedule'], domain: 'InspectionScheduling' },
  { keywords: ['inspection_payment_validation', 'validation'], domain: 'InspectionPaymentValidation' },
  { keywords: ['inspection_permission', 'permission'], domain: 'InspectionPermission' },
  { keywords: ['payment_blocking', 'block'], domain: 'PaymentBlocking' },
  { keywords: ['pv_generator', 'generator'], domain: 'PVGenerator' },
  { keywords: ['tender_estimate', 'estimate'], domain: 'TenderEstimate' },
  { keywords: ['tender_document', 'doc'], domain: 'TenderDocument' },
  { keywords: ['project_strategy_link', 'strategy'], domain: 'ProjectStrategyLink' },
  { keywords: ['project_budget_link', 'budget'], domain: 'ProjectBudgetLink' },
  { keywords: ['contact_message', 'message'], domain: 'ContactMessage' },
  { keywords: ['location', 'geo'], domain: 'Location' },
  { keywords: ['oauth', 'provider'], domain: 'OAuthProvider' },
];

const CONSOLIDATE_TYPES = {
  'CheckpointCategory': 'src/dtos/entities/MilestoneDTO.ts',
  'VerificationStatus': 'src/dtos/entities/MilestoneDTO.ts',
  'VerificationItemDTO': 'src/dtos/entities/MilestoneDTO.ts',
  'CheckpointVerificationDTO': 'src/dtos/entities/MilestoneDTO.ts',
  'CheckpointVerificationResultDTO': 'src/dtos/entities/MilestoneDTO.ts',
  'CheckpointDTO': 'src/dtos/entities/MilestoneDTO.ts',
  'InspectionDetails': 'src/dtos/entities/InspectionDTO.ts',
  'InspectionObservation': 'src/dtos/entities/InspectionDTO.ts',
  'ChecklistItem': 'src/dtos/entities/InspectionDTO.ts',
  'InspectionMeasurement': 'src/dtos/entities/InspectionDTO.ts',
  'InspectionParticipant': 'src/dtos/entities/InspectionDTO.ts',
  'ProjectRisk': 'src/dtos/entities/ProjectDTO.ts',
  'ProjectResource': 'src/dtos/entities/ProjectDTO.ts',
  'ProjectStakeholder': 'src/dtos/entities/ProjectDTO.ts',
  'ProjectBudget': 'src/dtos/entities/ProjectDTO.ts',
  'UserProfile': 'src/dtos/entities/UserDTO.ts',
  'EmployeeFormData': 'src/dtos/entities/EmployeeDTO.ts',
  'TaskAssignment': 'src/dtos/entities/TaskAssignmentDTO.ts',
  'Milestone': 'src/dtos/entities/MilestoneDTO.ts',
  'Workspace': 'src/dtos/entities/WorkspaceDTO.ts',
  'Task': 'src/dtos/entities/TaskAssignmentDTO.ts',
  'Notification': 'src/dtos/entities/NotificationDTO.ts',
  'Document': 'src/dtos/entities/DocumentDTO.ts',
  'PhaseStatus': 'src/dtos/types/phase-dto.ts',
  'ProjectStatus': 'src/dtos/entities/ProjectDTO.ts',
  'InspectionStatus': 'src/dtos/entities/InspectionDTO.ts',
  'MilestoneStatus': 'src/dtos/entities/MilestoneDTO.ts',
  'MilestoneType': 'src/dtos/entities/MilestoneDTO.ts',
  'RiskStatus': 'src/dtos/entities/RiskDTO.ts',
  'RiskLevel': 'src/dtos/entities/RiskDTO.ts',
  'RiskCategory': 'src/dtos/entities/RiskDTO.ts',
};

// ==========================================
// ANALYSEUR PRINCIPAL
// ==========================================
class SmartHexAnalyzer {
  constructor(options = {}) {
    this.options = { 
      fix: false, 
      cleanMocks: false, 
      dryRun: false, 
      json: false, 
      output: null, 
      moveTypes: false, 
      tsCheck: false, 
      ruleFilter: null, 
      failOn: 'error',
      scoring: false,
      consolidateDuplicates: false,
      semanticAnalysis: false,
      ...options 
    };
    
    this.report = {
      timestamp: new Date().toISOString(),
      stats: { 
        filesScanned: 0, 
        errors: 0, 
        warnings: 0, 
        fixed: 0, 
        mocksRemoved: 0, 
        duplicatesFound: 0, 
        typesMoved: 0,
        typesConsolidated: 0,
        p0Violations: 0
      },
      violations: [],
      movedTypes: [],
      duplicates: [],
      consolidatedTypes: [],
      fileScores: [],
      summary: {}
    };
    
    this.globalTypes = new Map();
    this.typeDeclarationsByName = new Map();
    this.typesToMove = [];
    this.dtoTypesToReconcile = [];
    this.fileContentsCache = new Map();
    this.projectRoot = process.cwd();
    this.knownEntities = this.collectKnownEntities();
    this.existingDtoTypes = this.buildExistingDtoTypesIndex();
  }

  /* ===================================================================
     DÉTECTION AUTOMATIQUE DES ENTITÉS MÉTIER
     =================================================================== */
  collectKnownEntities() {
    const entities = new Set();
    const entityDir = path.join(this.projectRoot, 'src', 'domain', 'entities');
    if (fs.existsSync(entityDir)) {
      for (const file of fs.readdirSync(entityDir)) {
        if (/\.ts$/.test(file)) {
          const content = fs.readFileSync(path.join(entityDir, file), 'utf8');
          const re = /export\s+(?:class|interface)\s+(\w+)/g;
          let m;
          while ((m = re.exec(content)) !== null) entities.add(m[1]);
        }
      }
    }
    const repoDir = path.join(this.projectRoot, 'src', 'domain', 'repositories');
    if (fs.existsSync(repoDir)) {
      for (const file of fs.readdirSync(repoDir)) {
        if (/\.ts$/.test(file)) {
          const content = fs.readFileSync(path.join(repoDir, file), 'utf8');
          const re = /export\s+interface\s+I(\w+)Repository\b/g;
          let m;
          while ((m = re.exec(content)) !== null) entities.add(m[1]);
        }
      }
    }
    return entities;
  }

  /* ===================================================================
     INDEX DES TYPES DÉJÀ DANS LES DTOS
     =================================================================== */
  buildExistingDtoTypesIndex() {
    const index = new Map();
    const dirs = [
      path.join(this.projectRoot, 'src', 'dtos', 'entities'),
      path.join(this.projectRoot, 'src', 'dtos', 'workflows'),
      path.join(this.projectRoot, 'src', 'dtos', 'types')
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const re = /export\s+(?:interface|type|enum)\s+(\w+)/g;
        let m;
        while ((m = re.exec(content)) !== null) {
          if (!index.has(m[1])) index.set(m[1], filePath);
        }
      }
    }
    return index;
  }

  /* ===================================================================
     DÉTECTION DE LA COUCHE ARCHITECTURALE
     =================================================================== */
  detectLayer(filePath) {
    for (const [layer, config] of Object.entries(ARCHITECTURE.layers)) {
      for (const pattern of config.paths) {
        if (filePath.includes(pattern)) {
          return layer;
        }
      }
    }
    return 'UNKNOWN';
  }

  /* ===================================================================
     DÉTECTION DU TYPE DE FICHIER
     =================================================================== */
  detectFileType(filePath) {
    for (const [name, type] of Object.entries(ARCHITECTURE.fileTypes)) {
      if (type.pattern.test(filePath)) {
        return {
          category: type.category,
          score: type.score,
          description: type.description,
          name: name
        };
      }
    }
    const ext = path.extname(filePath);
    if (ext === '.tsx') return { category: 'COMPONENT', score: 50, description: 'React Component', name: 'component' };
    if (ext === '.ts') return { category: 'UTILITY', score: 30, description: 'Utility File', name: 'utility' };
    return { category: 'UNKNOWN', score: 10, description: 'Unknown Type', name: 'unknown' };
  }

  /* ===================================================================
     CALCUL DU SCORE DU FICHIER
     =================================================================== */
  calculateFileScore(filePath, content, violations) {
    let score = 50;
    const fileType = this.detectFileType(filePath);
    const layer = this.detectLayer(filePath);
    
    score += fileType.score / 2;
    
    for (const violation of violations) {
      if (violation.ruleId && violation.ruleId.startsWith('P0')) {
        score -= 25;
        this.report.stats.p0Violations++;
      } else if (violation.severity === 'ERROR') {
        score -= 15;
      } else if (violation.severity === 'WARNING') {
        score -= 5;
      }
    }
    
    if (content.includes('Repository')) score += 5;
    if (content.includes('interface') && content.includes('export')) score += 5;
    if (content.includes('DTO')) score += 5;
    if (layer === 'UNKNOWN') score -= 10;
    if (fileType.category === 'LEGACY') score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  /* ===================================================================
     DÉTECTION DES TYPES DUPLIQUÉS
     =================================================================== */
  detectTypeDuplicates(filePath, content, fileViolations) {
    const re = /export\s+(?:interface|type|enum)\s+([A-Z]\w+)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const name = m[1];
      if (/Props$/.test(name)) continue;
      if (this.isPureReexportLine(content, m.index)) continue;
      const line = content.substring(0, m.index).split('\n').length;
      if (!this.typeDeclarationsByName.has(name)) this.typeDeclarationsByName.set(name, []);
      const locations = this.typeDeclarationsByName.get(name);
      if (!locations.some(l => l.file === filePath && l.line === line)) {
        locations.push({ file: filePath, line });
      }
      if (!this.globalTypes.has(name)) this.globalTypes.set(name, filePath);
    }
  }

  /* ===================================================================
     CONSOLIDATION DES TYPES DUPLIQUÉS
     =================================================================== */
  consolidateDuplicates() {
    if (!this.options.consolidateDuplicates) return;
    
    const duplicateEntries = [];
    for (const [name, locations] of this.typeDeclarationsByName.entries()) {
      const uniqueFiles = [...new Set(locations.map(l => l.file))];
      if (uniqueFiles.length < 2) continue;
      
      const targetFile = CONSOLIDATE_TYPES[name];
      if (!targetFile) {
        if (this.options.scoring) {
          console.log(`⚠️ Type ${name} dupliqué mais pas dans la liste de consolidation`);
        }
        continue;
      }
      
      const targetPath = path.join(this.projectRoot, targetFile);
      if (!fs.existsSync(targetPath)) {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, `// ${path.basename(targetPath)}\n// Consolidated DTO\n\n`);
      }
      
      duplicateEntries.push({
        typeName: name,
        locations: locations.map(l => ({ file: l.file, line: l.line })),
        targetFile: targetPath
      });
    }
    
    if (duplicateEntries.length === 0) {
      if (this.options.scoring) console.log('✅ Aucun type dupliqué à consolider.');
      return;
    }
    
    console.log(`\n🔧 Consolidation de ${duplicateEntries.length} types dupliqués...`);
    
    for (const entry of duplicateEntries) {
      const { typeName, locations, targetFile } = entry;
      
      let targetContent = fs.readFileSync(targetFile, 'utf8');
      const typeRegex = new RegExp(`(?:export\\s+)?(?:interface|type|enum)\\s+${typeName}\\b`);
      if (typeRegex.test(targetContent)) {
        console.log(`⏭️ Type ${typeName} déjà présent dans ${path.relative(this.projectRoot, targetFile)}`);
        continue;
      }
      
      let bestDefinition = '';
      let bestFile = '';
      let maxFields = 0;
      
      for (const loc of locations) {
        const content = fs.readFileSync(loc.file, 'utf8');
        const lines = content.split('\n');
        const startLine = loc.line - 1;
        
        let definition = '';
        let braceCount = 0;
        let started = false;
        let fieldCount = 0;
        
        for (let i = startLine; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          if (!started && new RegExp(`export\\s+(interface|type|enum)\\s+${typeName}\\b`).test(line)) {
            started = true;
            braceCount += (line.match(/{/g) || []).length;
            definition += line + '\n';
          } else if (started) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            definition += line + '\n';
            
            if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*') && trimmedLine !== '}') {
              if (trimmedLine.includes(':') && !trimmedLine.includes('=>')) {
                fieldCount++;
              }
            }
            
            if (braceCount === 0 && line.includes('}')) break;
          }
        }
        
        if (fieldCount > maxFields) {
          maxFields = fieldCount;
          bestDefinition = definition;
          bestFile = loc.file;
        }
      }
      
      if (!bestDefinition) {
        console.log(`⚠️ Impossible d'extraire la définition de ${typeName}`);
        continue;
      }
      
      const relPath = path.relative(this.projectRoot, bestFile);
      const separator = targetContent.trimEnd().endsWith('\n\n') ? '' : '\n\n';
      const newContent = targetContent.trimEnd() + separator +
        `// Consolidated from ${relPath}\n${bestDefinition}`;
      
      if (!this.options.dryRun) {
        fs.writeFileSync(targetFile, newContent, 'utf8');
        this.report.consolidatedTypes.push({
          typeName,
          from: locations.map(l => l.file),
          to: targetFile
        });
        this.report.stats.typesConsolidated++;
        console.log(`✅ Type ${typeName} consolidé dans ${path.relative(this.projectRoot, targetFile)}`);
      } else {
        console.log(`[DRY RUN] Would consolidate ${typeName} in ${path.relative(this.projectRoot, targetFile)}`);
      }
      
      if (!this.options.dryRun) {
        for (const loc of locations) {
          if (loc.file === targetFile) continue;
          let content = fs.readFileSync(loc.file, 'utf8');
          const lines = content.split('\n');
          const startLine = loc.line - 1;
          
          let endLine = startLine;
          let braceCount = 0;
          let started = false;
          for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            if (!started && new RegExp(`export\\s+(interface|type|enum)\\s+${typeName}\\b`).test(line)) {
              started = true;
              braceCount += (line.match(/{/g) || []).length;
            } else if (started) {
              braceCount += (line.match(/{/g) || []).length;
              braceCount -= (line.match(/}/g) || []).length;
              if (braceCount === 0 && line.includes('}')) {
                endLine = i;
                break;
              }
            }
          }
          
          lines.splice(startLine, endLine - startLine + 1);
          const newContent2 = lines.join('\n');
          fs.writeFileSync(loc.file, newContent2, 'utf8');
          console.log(`🗑️ Définition supprimée de ${path.relative(this.projectRoot, loc.file)}`);
        }
      }
    }
  }

  /* ===================================================================
     ANALYSE SÉMANTIQUE AVANCÉE
     =================================================================== */
  semanticAnalysis(filePath, content) {
    const analysis = {
      file: path.relative(this.projectRoot, filePath),
      type: this.detectFileType(filePath),
      layer: this.detectLayer(filePath),
      complexity: this.calculateComplexity(content),
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      types: this.extractTypes(content),
      suggestions: []
    };
    
    analysis.suggestions = this.generateSemanticSuggestions(analysis, content);
    return analysis;
  }

  calculateComplexity(content) {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|=>\s*{/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    const interfaces = (content.match(/interface\s+\w+/g) || []).length;
    const imports = (content.match(/import\s+/g) || []).length;
    
    let score = 1;
    if (lines > 100) score++;
    if (lines > 300) score++;
    if (lines > 500) score++;
    if (functions > 10) score++;
    if (functions > 20) score++;
    if (classes > 3) score++;
    if (interfaces > 5) score++;
    if (imports > 15) score++;
    if (imports > 30) score++;
    
    return {
      lines,
      functions,
      classes,
      interfaces,
      imports,
      score: Math.min(score, 10)
    };
  }

  extractImports(content) {
    const imports = [];
    const regex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const names = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];
      imports.push({
        names: names,
        source: match[3],
        line: content.substring(0, match.index).split('\n').length
      });
    }
    return imports;
  }

  extractExports(content) {
    const exports = [];
    const regex = /export\s+(?:{(.+?)}|(?:interface|type|enum|const|function|class)\s+(\w+))/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1]) {
        const names = match[1].split(',').map(s => s.trim());
        exports.push({ type: 'named', names });
      } else if (match[2]) {
        exports.push({ type: 'declaration', name: match[2] });
      }
    }
    return exports;
  }

  extractTypes(content) {
    const types = [];
    const patterns = [
      /(?:^|\n)\s*export\s+interface\s+(\w+)/g,
      /(?:^|\n)\s*export\s+type\s+(\w+)/g,
      /(?:^|\n)\s*export\s+enum\s+(\w+)/g,
      /(?:^|\n)\s*(?:interface|type|enum)\s+(\w+)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        if (!types.find(t => t.name === name)) {
          const kind = match[0].includes('interface') ? 'interface' :
                      match[0].includes('enum') ? 'enum' : 'type';
          types.push({
            name: name,
            kind: kind,
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    }
    return types;
  }

  generateSemanticSuggestions(analysis, content) {
    const suggestions = [];
    const { type, layer, imports, complexity } = analysis;
    
    if (type.category === 'LEGACY' && layer === 'UNKNOWN') {
      suggestions.push({
        priority: 'HIGH',
        message: `📦 Fichier legacy à migrer vers l'architecture hexagonale`,
        action: `Déplacer vers src/application/services/ ou src/infrastructure/adapters/`
      });
    }
    
    for (const imp of imports) {
      if (imp.source.includes('@/services/')) {
        suggestions.push({
          priority: 'HIGH',
          message: `🔧 Import legacy @/services/ détecté`,
          action: `Remplacer par @/application/services/`
        });
      }
      if (imp.source.includes('@/types/')) {
        suggestions.push({
          priority: 'HIGH',
          message: `🔧 Import legacy @/types/ détecté`,
          action: `Remplacer par @/dtos/entities/`
        });
      }
    }
    
    if (complexity.score > 7) {
      suggestions.push({
        priority: 'MEDIUM',
        message: `📊 Fichier complexe (score: ${complexity.score}/10)`,
        action: `Extraire les responsabilités dans des fichiers séparés`
      });
    }
    
    return suggestions;
  }

  /* ===================================================================
     ANALYSE D'UN FICHIER
     =================================================================== */
  analyzeFile(filePath) {
    this.report.stats.filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    this.fileContentsCache.set(filePath, content);
    let modifiedContent = content;
    let fileModified = false;
    const fileViolations = [];
    let hasDirectDbCall = false;
    const isUIFile = filePath.includes(path.join('src', 'pages')) || filePath.includes(path.join('src', 'components')) || filePath.includes('App.tsx');
    const isTsx = filePath.endsWith('.tsx');
    const typeRegions = this.getTypeRegions(content);
    
    if (!this.options.ruleFilter || this.options.ruleFilter.includes('D001')) {
      this.detectTypeDuplicates(filePath, content, fileViolations);
    }
    
    const sortedRules = Object.entries(RULES).sort((a, b) => a[1].priority - b[1].priority);

    for (const [key, rule] of sortedRules) {
      if (this.options.ruleFilter && !this.options.ruleFilter.includes(rule.id)) continue;
      if (rule.target === 'UI' && !isUIFile) continue;
      if (!this.shouldApplyFileRule(filePath, rule)) continue;

      // Règle M003 - STATIC_MOCK_DATA (check personnalisé)
      if (rule.id === 'M003') {
        if (!this.shouldExclude(filePath, rule)) {
          if (rule.pattern) {
            rule.pattern.lastIndex = 0;
            let m;
            while ((m = rule.pattern.exec(content)) !== null) {
              const block = m[0], varName = m[1];
              const res = rule.check(block, varName);
              if (res) {
                const line = content.substring(0, m.index).split('\n').length;
                fileViolations.push({ 
                  ruleId: rule.id, 
                  priority: rule.priority, 
                  severity: rule.severity, 
                  message: `${rule.message} (${res})`, 
                  line, 
                  match: varName 
                });
                this.report.stats.warnings++;
              }
            }
          }
        }
        continue;
      }

      // Règle P0-M001 - MISSING_IMPLEMENTATION (check personnalisé)
      if (rule.id === 'P0-M001') {
        if (!this.shouldExclude(filePath, rule)) {
          const checkResult = rule.check(content);
          if (checkResult.total > 0) {
            const violation = { 
              ruleId: rule.id, 
              priority: rule.priority, 
              severity: rule.severity, 
              message: `${rule.message} (${checkResult.emptyFunctions} fonctions vides, ${checkResult.todoComments} TODO, ${checkResult.notImplemented} Not Implemented)`,
              line: 1, 
              match: 'TODO/NotImplemented/empty function'
            };
            if (!fileViolations.some(v => v.ruleId === rule.id)) {
              fileViolations.push(violation);
              this.report.stats.errors++;
            }
          }
        }
        continue;
      }

      // Règle P1-TRF002 - TRANSFORMER_COMPLETENESS (check personnalisé)
      if (rule.id === 'P1-TRF002') {
        if (!this.shouldExclude(filePath, rule)) {
          if (rule.pattern) {
            rule.pattern.lastIndex = 0;
            let m;
            while ((m = rule.pattern.exec(content)) !== null) {
              const transformerContent = m[2];
              const res = rule.check(transformerContent);
              if (res) {
                const line = content.substring(0, m.index).split('\n').length;
                fileViolations.push({ 
                  ruleId: rule.id, 
                  priority: rule.priority, 
                  severity: rule.severity, 
                  message: `${rule.message} (${res})`, 
                  line, 
                  match: m[1] 
                });
                this.report.stats.warnings++;
              }
            }
          }
        }
        continue;
      }

      // Règles avec pattern standard
      if (rule.pattern) {
        rule.pattern.lastIndex = 0;
        let m;
        while ((m = rule.pattern.exec(modifiedContent)) !== null) {
          if (rule.id === 'P0-SUP001' || rule.id === 'P0-DB001') {
            hasDirectDbCall = true;
          }
          const line = modifiedContent.substring(0, m.index).split('\n').length;
          if (rule.skipIfInStringOrComment && this.isInStringOrComment(modifiedContent, m.index)) continue;
          if (rule.skipIfObjectKey && this.isObjectKeyPosition(modifiedContent, m)) continue;

          // Règle P2-CAS001 - SNAKE_CASE_IDENTIFIER
          if (rule.id === 'P2-CAS001') {
            const inType = this.isInTypeRegion(m.index, typeRegions);
            const fileIsDomainOrDtos = this.isDomainOrDtosFile(filePath);
            if (inType && !fileIsDomainOrDtos) {
              const region = typeRegions.find(r => m.index >= r.start && m.index <= r.end);
              const violation = { 
                ruleId: 'P2-CAS001', 
                priority: rule.priority, 
                severity: 'ERROR', 
                message: '❌ [P2-CAS001] Snake_case field in type definition – move the entire type.', 
                line, 
                match: m[0], 
                typeRegion: region 
              };
              if (!fileViolations.some(v => v.line === line && v.ruleId === 'P2-CAS001' && v.message.includes('move the entire type'))) {
                fileViolations.push(violation); 
                this.report.stats.errors++;
              }
              continue;
            }
            if (inType && fileIsDomainOrDtos) {
              if (this.options.fix && rule.isAutoFixable && rule.fix) {
                const replacement = rule.fix(m[0]);
                if (replacement !== m[0]) { 
                  modifiedContent = modifiedContent.replace(m[0], replacement); 
                  fileModified = true; 
                  this.report.stats.fixed++; 
                }
              } else {
                fileViolations.push({ 
                  ruleId: rule.id, 
                  priority: rule.priority, 
                  severity: rule.severity, 
                  message: rule.message, 
                  line, 
                  match: m[0] 
                });
                this.report.stats.warnings++;
              }
              continue;
            }
            fileViolations.push({ 
              ruleId: rule.id, 
              priority: rule.priority, 
              severity: 'WARNING', 
              message: '⚠️ [P2-CAS001] Snake_case identifier – may be DB field.', 
              line, 
              match: m[0] 
            });
            this.report.stats.warnings++;
            continue;
          }

          // Règle P1-TYP001 - TYPE_DEFINITION_LOCATION
          if (rule.id === 'P1-TYP001') {
            const typeName = m[2];
            if (typeName && /Props$/.test(typeName)) continue;
            const usageCount = (modifiedContent.match(new RegExp(`\\b${typeName}\\b`, 'g')) || []).length;
            if (usageCount <= 1) continue;
          }

          let extraMsg = '';
          if (rule.id === 'P0-SUP001') {
            const context = this.findContextDomain(modifiedContent, m.index);
            if (context) {
              extraMsg = ` → Utiliser ${context.suggestion}`;
            }
          }

          const violation = { 
            ruleId: rule.id, 
            priority: rule.priority, 
            severity: rule.severity, 
            message: rule.message + extraMsg, 
            line, 
            match: m[0] 
          };
          
          if (!fileViolations.some(v => v.line === line && v.ruleId === rule.id)) {
            fileViolations.push(violation);
            if (rule.severity === 'ERROR') this.report.stats.errors++; 
            else this.report.stats.warnings++;
          }

          if (this.options.fix && rule.isAutoFixable && rule.fix && !(rule.id === 'P2-CAS001' && this.isInTypeRegion(m.index, typeRegions))) {
            const repl = rule.fix(m[0], m[1], m[2], filePath);
            if (repl && repl !== m[0]) { 
              modifiedContent = modifiedContent.replace(m[0], repl); 
              fileModified = true; 
              this.report.stats.fixed++; 
            }
          }

          if (this.options.cleanMocks && (rule.id === 'M001' || rule.id === 'M002' || rule.id === 'M003')) {
            if (!/TODO/i.test(m[0])) {
              modifiedContent = modifiedContent.replace(m[0], '/* [CLEANED MOCK] */');
              fileModified = true;
              this.report.stats.mocksRemoved++;
            }
          }
        }
      }
    }

    if (hasDirectDbCall) {
      fileViolations.forEach(v => { 
        if (v.ruleId === 'P2-CAS001') v.message += ' (ℹ️ probably DB→domain missing)'; 
      });
    }

    for (const region of typeRegions) {
      const { start, end, typeName } = region;
      if (this.isDomainOrDtosFile(filePath)) continue;
      const typeContent = content.substring(start, end + 1);
      const hasSnake = /\b[a-z]+_[a-z]+\b/.test(typeContent);
      if (!hasSnake) continue;
      if (isTsx && (this.isReactProps(typeContent) || /Props$/i.test(typeName))) continue;
      const importedFromDto = new RegExp(`import\\s+{[^}]*\\b${typeName}\\b[^}]*}\\s+from\\s+['"]@/dtos/`).test(content);
      if (importedFromDto) continue;
      if (this.globalTypes.has(typeName) && this.globalTypes.get(typeName) !== filePath) continue;
      if (!this.typesToMove.some(t => t.filePath === filePath && t.typeName === typeName)) {
        let camel = typeContent.replace(/\b([a-z]+_[a-z]+)\b/g, m => m.replace(/_([a-z])/g, (_, l) => l.toUpperCase()));
        if (!/^\s*export\s+/.test(camel.trimStart())) camel = camel.replace(/(interface|type)\s+/, 'export $1 ');
        this.typesToMove.push({ filePath, typeName, original: typeContent, camel, region: { start, end } });
      }
    }

    if (this.options.semanticAnalysis) {
      const semantic = this.semanticAnalysis(filePath, content);
      for (const suggestion of semantic.suggestions) {
        fileViolations.push({
          ruleId: 'S001',
          priority: 1,
          severity: 'INFO',
          message: `💡 ${suggestion.message}`,
          line: 0,
          match: suggestion.action
        });
      }
    }

    if (this.options.scoring) {
      const score = this.calculateFileScore(filePath, content, fileViolations);
      this.report.fileScores.push({
        file: path.relative(this.projectRoot, filePath),
        score: score,
        type: this.detectFileType(filePath).category,
        layer: this.detectLayer(filePath),
        violations: fileViolations.length,
        p0Violations: fileViolations.filter(v => v.ruleId && v.ruleId.startsWith('P0')).length
      });
    }

    if (fileViolations.length > 0) {
      fileViolations.sort((a, b) => a.priority - b.priority);
      this.report.violations.push({ file: path.relative(this.projectRoot, filePath), violations: fileViolations });
    }
    
    if (fileModified && !this.options.dryRun) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      this.fileContentsCache.set(filePath, modifiedContent);
    }
    
    return modifiedContent;
  }

  /* ===================================================================
     OUTILS DE BASE
     =================================================================== */
  shouldExclude(filePath, rule) { return rule.exclude?.some(p => filePath.includes(p)) ?? false; }
  shouldApplyFileRule(filePath, rule) { if (rule.checkFile && !rule.checkFile(filePath)) return false; return !this.shouldExclude(filePath, rule); }

  getTypeRegions(content) {
    const regions = [];
    const re = /\b(interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = re.exec(content)) !== null) {
      if (this.isInStringOrComment(content, match.index)) continue;
      const keyword = match[1];
      const typeName = match[2];
      let pos = match.index + match[0].length;
      let foundEqual = false;
      while (pos < content.length) {
        const ch = content[pos], next = content[pos + 1];
        if (ch === '/' && next === '/') { while (pos < content.length && content[pos] !== '\n') pos++; continue; }
        if (ch === '/' && next === '*') { pos += 2; while (pos < content.length && !(content[pos] === '*' && content[pos + 1] === '/')) pos++; pos += 2; continue; }
        if (ch === '\n' || ch === ' ' || ch === '\t' || ch === '\r') { pos++; continue; }
        if (keyword === 'type' && ch === '=' && !foundEqual) { foundEqual = true; pos++; continue; }
        break;
      }
      if (pos >= content.length || content[pos] !== '{') continue;
      let depth = 0, inStr = false, strChar = '', inComm = false, commType = '';
      let end = pos;
      for (let j = pos; j < content.length; j++) {
        const ch = content[j], nx = content[j + 1];
        if (inComm) {
          if (commType === 'line' && ch === '\n') inComm = false;
          else if (commType === 'block' && ch === '*' && nx === '/') { inComm = false; j++; }
          continue;
        }
        if (inStr) {
          if (ch === '\\') { j++; continue; }
          if (ch === strChar) { inStr = false; continue; }
          continue;
        }
        if (ch === '/' && nx === '/') { inComm = true; commType = 'line'; j++; continue; }
        if (ch === '/' && nx === '*') { inComm = true; commType = 'block'; j++; continue; }
        if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { end = j; break; } }
      }
      regions.push({ start: match.index, end, typeName, typeKind: keyword });
    }
    return regions;
  }

  isInTypeRegion(pos, regions) { return regions.some(r => pos >= r.start && pos <= r.end); }
  isDomainOrDtosFile(filePath) { const n = filePath.replace(/\\/g, '/'); return n.includes('/domain/') || n.includes('/dtos/'); }
  isReactProps(typeContent) { return REACT_PROP_INDICATORS.test(typeContent); }

  cleanTypeName(typeName) {
    const prefixes = /^(create|update|delete|get|set|add|remove|fetch|dev|test|mock|send|render|use)/i;
    const suffixes = /(request|response|formdata|form|dto|input|output|data|options|values|list|info|details|notification|action|block|props|state|context|config|params)$/i;
    let base = typeName.replace(prefixes, '').replace(suffixes, '');
    if (!base) base = typeName;
    base = base.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    base = base.charAt(0).toUpperCase() + base.slice(1).replace(/DTO$/i, '');
    return GENERIC_NAMES.has(base.toLowerCase()) ? null : base;
  }

  getFileContextDomain(filePath) {
    const rel = path.relative(path.join(this.projectRoot, 'src'), filePath);
    const parts = rel.split(/[\\/]/);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'components' || parts[i] === 'pages') {
        const next = parts[i + 1];
        if (next && !/^[A-Z]/.test(next)) {
          return next.charAt(0).toUpperCase() + next.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        }
      }
    }
    return null;
  }

  extractDomainFromFileImports(content) {
    const importRe = /import\s+{[^}]*}\s+from\s+['"]@\/dtos\/entities\/(\w+)DTO['"]/g;
    let m;
    const domains = [];
    while ((m = importRe.exec(content)) !== null) {
      domains.push(m[1]);
    }
    return domains.length > 0 ? domains[0] : null;
  }

  getDomainFromKeywords(typeName) {
    const lowerName = typeName.toLowerCase();
    for (const { keywords, domain } of KEYWORD_DOMAIN_HINTS) {
      for (const kw of keywords) {
        if (lowerName.includes(kw)) return domain;
      }
    }
    return null;
  }

  resolveDomain(typeName, filePath, fileContent) {
    if (DOMAIN_MAP[typeName]) return DOMAIN_MAP[typeName];

    const keywordDomain = this.getDomainFromKeywords(typeName);
    if (keywordDomain) return keywordDomain;

    const cleaned = this.cleanTypeName(typeName);
    if (cleaned) {
      const words = cleaned.match(/[A-Z][a-z]+/g) || [];
      let bestMatch = null, bestLen = 0;
      for (const word of words) {
        if (this.knownEntities.has(word) && word.length > bestLen) {
          bestMatch = word; bestLen = word.length;
        }
      }
      if (bestMatch) return bestMatch;
      if (this.knownEntities.has(cleaned)) return cleaned;
    }

    if (filePath) {
      const ctx = this.getFileContextDomain(filePath);
      if (ctx && this.knownEntities.has(ctx)) return ctx;
    }
    if (fileContent) {
      const importDomain = this.extractDomainFromFileImports(fileContent);
      if (importDomain && this.knownEntities.has(importDomain)) return importDomain;
    }

    const rawWords = typeName.match(/[A-Z][a-z]+/g) || [];
    for (const w of rawWords) {
      if (this.knownEntities.has(w)) return w;
    }

    return cleaned && !GENERIC_NAMES.has(cleaned.toLowerCase()) ? cleaned : null;
  }

  findBestDtoFile(typeName, filePath, fileContent) {
    const existing = this.existingDtoTypes.get(typeName);
    if (existing) {
      const domain = this.resolveDomain(typeName, filePath, fileContent);
      if (domain) {
        const fileBase = path.basename(existing, path.extname(existing)).replace(/DTO$/i, '');
        if (fileBase.toLowerCase() === domain.toLowerCase()) return existing;
        return null;
      }
      return existing;
    }

    const domain = this.resolveDomain(typeName, filePath, fileContent);
    if (!domain) return null;

    const dirs = [
      path.join(this.projectRoot, 'src', 'dtos', 'entities'),
      path.join(this.projectRoot, 'src', 'dtos', 'workflows')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const baseName = path.basename(file, path.extname(file)).replace(/DTO$/i, '');
        if (baseName.toLowerCase() === domain.toLowerCase()) return path.join(dir, file);
      }
    }

    const lowerDomain = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const base = path.basename(file, path.extname(file)).replace(/DTO$/i, '').replace(/[^a-z0-9]/g, '').toLowerCase();
        if (lowerDomain.includes(base) || base.includes(lowerDomain)) return path.join(dir, file);
      }
    }

    let bestScore = 0, bestFile = null;
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const base = path.basename(file, path.extname(file)).replace(/DTO$/i, '').replace(/[^a-z0-9]/g, '').toLowerCase();
        const commonLen = this.longestCommonSubstring(lowerDomain, base).length;
        const ratio = commonLen / Math.max(lowerDomain.length, base.length);
        const score = commonLen >= 3 ? ratio : 0;
        if (score > bestScore) { bestScore = score; bestFile = path.join(dir, file); }
      }
    }
    if (bestScore >= 0.5) return bestFile;

    return null;
  }

  longestCommonSubstring(s1, s2) {
    const m = s1.length, n = s2.length;
    let maxLen = 0, endPos = 0;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          if (dp[i][j] > maxLen) { maxLen = dp[i][j]; endPos = i - 1; }
        }
      }
    }
    return s1.substring(endPos - maxLen + 1, endPos + 1);
  }

  isInStringOrComment(code, pos) {
    let sq = false, dq = false, bt = false, lc = false, bc = false;
    for (let i = 0; i < pos; i++) {
      const ch = code[i], nx = code[i + 1];
      if (ch === '\n') { lc = false; sq = false; dq = false; }
      if (!sq && !dq && !bt && !bc) {
        if (ch === '/' && nx === '/') { lc = true; i++; continue; }
        if (ch === '/' && nx === '*') { bc = true; i++; continue; }
      }
      if (bc) { if (ch === '*' && nx === '/') { bc = false; i++; } continue; }
      if (lc) continue;
      if (!sq && !dq && !bt) {
        if (ch === "'") sq = true; else if (ch === '"') dq = true; else if (ch === '`') bt = true;
      } else if (sq && ch === "'" && code[i - 1] !== '\\') sq = false;
      else if (dq && ch === '"' && code[i - 1] !== '\\') dq = false;
      else if (bt && ch === '`' && code[i - 1] !== '\\') bt = false;
    }
    return sq || dq || bt || lc || bc;
  }

  isObjectKeyPosition(content, m) {
    const after = content.slice(m.index + m[0].length);
    const afterTrim = after.match(/^\s*/)[0].length;
    if (after[afterTrim] !== ':' ) return false;
    if (after[afterTrim + 1] === ':') return false;
    const before = content.slice(0, m.index);
    const beforeTrim = before.match(/\s*$/)[0];
    const prevChar = before[before.length - beforeTrim.length - 1];
    return prevChar === '{' || prevChar === ',';
  }

  isPureReexportLine(content, matchIndex) {
    const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
    const lineEnd = content.indexOf('\n', matchIndex);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
    return /export\s+\*\s+from\s+['"]/.test(line) || /export\s+type\s*{[^}]*}\s*from\s+['"]/.test(line);
  }

  findContextDomain(content, matchIndex) {
    const before = content.substring(0, matchIndex);
    const funcMatch = before.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
    let lastFuncName = '';
    if (funcMatch) {
      const last = funcMatch[funcMatch.length - 1];
      const m = last.match(/(?:function\s+|const\s+)(\w+)/);
      if (m) lastFuncName = m[1].toLowerCase();
    }
    const contextMap = RULES.DIRECT_SUPABASE.contextMap || {};
    for (const [key, val] of Object.entries(contextMap)) {
      if (lastFuncName.includes(key.replace(/_/g, ''))) return { domain: key, suggestion: val };
    }
    return null;
  }

  /* ===================================================================
     DÉPLACEMENT DES TYPES
     =================================================================== */
  moveMisplacedTypes() {
    if (this.typesToMove.length === 0) return;
    const entitiesDir = path.join(this.projectRoot, 'src', 'dtos', 'entities');
    if (!fs.existsSync(entitiesDir)) fs.mkdirSync(entitiesDir, { recursive: true });

    const fileMap = new Map();
    const importPaths = new Map();

    for (const t of this.typesToMove) {
      const fileContent = this.fileContentsCache.get(t.filePath) || '';
      const bestFile = this.findBestDtoFile(t.typeName, t.filePath, fileContent);

      if (bestFile && this.existingDtoTypes.get(t.typeName) === bestFile) {
        console.log(`⏭️ Type ${t.typeName} déjà dans le bon DTO ${bestFile} – mise à jour de l'import.`);
        importPaths.set(t.typeName, `@/dtos/entities/${path.basename(bestFile, '.ts')}`);
        continue;
      }

      let dtoFile = bestFile;
      if (!dtoFile) {
        const domain = this.resolveDomain(t.typeName, t.filePath, fileContent);
        if (!domain) {
          console.log(`⚠️ Type ${t.typeName} ignoré (domaine inconnu).`);
          continue;
        }
        const existingDtoFiles = this.getAllExistingDtoFiles();
        let closestFile = null;
        let closestScore = 0;
        for (const file of existingDtoFiles) {
          const base = path.basename(file, path.extname(file)).replace(/DTO$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const domainLower = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
          const commonLen = this.longestCommonSubstring(domainLower, base).length;
          const ratio = commonLen / Math.max(domainLower.length, base.length);
          const score = commonLen >= 3 ? ratio : 0;
          if (score > closestScore) { closestScore = score; closestFile = file; }
        }
        if (closestScore >= 0.5 && closestFile) {
          dtoFile = closestFile;
          console.log(`🔀 Type ${t.typeName} redirigé vers le DTO existant ${dtoFile} (domaine "${domain}" proche).`);
        } else if (this.knownEntities.has(domain) || DOMAIN_MAP[t.typeName]) {
          dtoFile = path.join(entitiesDir, domain + 'DTO.ts');
          console.log(`📄 Création d'un nouveau fichier ${dtoFile} pour l'entité ${domain}.`);
        } else {
          console.log(`⚠️ Type ${t.typeName} ignoré (domaine "${domain}" non reconnu et aucun DTO proche).`);
          continue;
        }
      }

      let targetContent = this.fileContentsCache.get(dtoFile);
      if (!targetContent && fs.existsSync(dtoFile)) {
        targetContent = fs.readFileSync(dtoFile, 'utf8');
        this.fileContentsCache.set(dtoFile, targetContent);
      }
      if (targetContent) {
        const typeDefRegex = new RegExp(`(?:export\\s+)?(?:interface|type)\\s+${t.typeName}\\b`, 'g');
        if (typeDefRegex.test(targetContent)) {
          console.log(`⏭️ Type ${t.typeName} déjà présent dans ${dtoFile} – ignoré.`);
          continue;
        }
      }

      const importPath = `@/dtos/entities/${path.basename(dtoFile, '.ts')}`;
      importPaths.set(t.typeName, importPath);
      if (!fileMap.has(dtoFile)) fileMap.set(dtoFile, []);
      fileMap.get(dtoFile).push(t);
      if (!this.options.dryRun) this.report.movedTypes.push({ type: t.typeName, from: t.filePath, to: dtoFile });
    }

    for (const [dtoFilePath, types] of fileMap.entries()) {
      const existing = fs.existsSync(dtoFilePath) ? fs.readFileSync(dtoFilePath, 'utf8') : '';
      let newContent = existing ? existing.trimEnd() : '// Auto-generated DTO\n';
      for (const t of types) {
        const relPath = path.relative(this.projectRoot, t.filePath);
        newContent += `\n// Moved from ${relPath}\n${t.camel}\n`;
      }
      if (!this.options.dryRun) fs.writeFileSync(dtoFilePath, newContent, 'utf8');
      else console.log(`[DRY RUN] Would update ${dtoFilePath}`);
      console.log(existing ? `📦 Ajout dans ${dtoFilePath}` : `📄 Création ${dtoFilePath}`);
    }

    const perSourceFile = new Map();
    for (const t of this.typesToMove) {
      const impPath = importPaths.get(t.typeName);
      if (!impPath) continue;
      if (!perSourceFile.has(t.filePath)) perSourceFile.set(t.filePath, []);
      perSourceFile.get(t.filePath).push(t);
    }
    for (const [filePath, types] of perSourceFile.entries()) {
      let content = this.fileContentsCache.get(filePath) || fs.readFileSync(filePath, 'utf8');
      types.sort((a, b) => b.region.start - a.region.start);
      const newImports = [];
      for (const t of types) {
        const impPath = importPaths.get(t.typeName);
        if (!impPath) continue;
        const before = content.substring(0, t.region.start).replace(/(\s*)export\s+$/, '$1');
        const after = content.substring(t.region.end + 1);
        content = before + after;
        const stmt = `import { ${t.typeName} } from '${impPath}';`;
        if (!newImports.some(s => s.includes(`{ ${t.typeName} }`))) newImports.push(stmt);
      }
      content = content.replace(/\n{3,}/g, '\n\n').trim();
      if (newImports.length) {
        const importLines = content.match(/^import\s+.*?;\s*$/gm);
        if (importLines) {
          const last = importLines[importLines.length - 1];
          const idx = content.indexOf(last) + last.length;
          content = content.slice(0, idx) + '\n' + newImports.join('\n') + content.slice(idx);
        } else {
          content = newImports.join('\n') + '\n' + content;
        }
      }
      if (!this.options.dryRun) fs.writeFileSync(filePath, content, 'utf8');
      else console.log(`[DRY RUN] Would modify ${filePath}`);
      this.fileContentsCache.set(filePath, content);
      for (const t of types) {
        const impPath = importPaths.get(t.typeName);
        if (impPath) this.updateImportsAcrossFiles(t.typeName, impPath, filePath);
      }
    }
  }

  getAllExistingDtoFiles() {
    const files = [];
    const dirs = [
      path.join(this.projectRoot, 'src', 'dtos', 'entities'),
      path.join(this.projectRoot, 'src', 'dtos', 'workflows')
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f))) {
        files.push(path.join(dir, file));
      }
    }
    return files;
  }

  /* ===================================================================
     RÉCONCILIATION DES FICHIERS DTO
     =================================================================== */
  reconcileDtoFiles() {
    const entitiesDir = path.join(this.projectRoot, 'src', 'dtos', 'entities');
    const workflowsDir = path.join(this.projectRoot, 'src', 'dtos', 'workflows');
    const dirs = [entitiesDir];
    if (fs.existsSync(workflowsDir)) dirs.push(workflowsDir);

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));

      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const typeRegions = this.getTypeRegions(content);

        for (const region of typeRegions) {
          const { typeName } = region;
          if (this.typesToMove.some(t => t.typeName === typeName)) continue;

          const domain = this.resolveDomain(typeName, filePath, content);
          if (!domain) continue;

          const fileBase = path.basename(file, path.extname(file)).replace(/DTO$/i, '');
          if (fileBase.toLowerCase() === domain.toLowerCase()) continue;

          const targetFile = this.findBestDtoFile(typeName, filePath, content);
          if (targetFile && path.resolve(targetFile) === path.resolve(filePath)) continue;

          if (!this.dtoTypesToReconcile.some(t => t.typeName === typeName && t.sourceFile === filePath)) {
            const typeContent = content.substring(region.start, region.end + 1);
            let camel = typeContent.replace(/\b([a-z]+_[a-z]+)\b/g, m =>
              m.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
            );
            if (!/^\s*export\s+/.test(camel.trimStart())) {
              camel = camel.replace(/(interface|type)\s+/, 'export $1 ');
            }
            this.dtoTypesToReconcile.push({
              typeName,
              sourceFile: filePath,
              domain,
              original: typeContent,
              camel,
              region: { start: region.start, end: region.end }
            });
          }
        }
      }
    }
  }

  applyDtoReconciliation() {
    if (this.dtoTypesToReconcile.length === 0) return;

    const entitiesDir = path.join(this.projectRoot, 'src', 'dtos', 'entities');
    const fileMap = new Map();
    const importPaths = new Map();

    for (const t of this.dtoTypesToReconcile) {
      let targetFile = this.findBestDtoFile(t.typeName, t.sourceFile, '');
      if (!targetFile) {
        const existingDtoFiles = this.getAllExistingDtoFiles();
        let closestFile = null;
        let closestScore = 0;
        for (const file of existingDtoFiles) {
          const base = path.basename(file, path.extname(file)).replace(/DTO$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const domainLower = t.domain.toLowerCase().replace(/[^a-z0-9]/g, '');
          const commonLen = this.longestCommonSubstring(domainLower, base).length;
          const ratio = commonLen / Math.max(domainLower.length, base.length);
          const score = commonLen >= 3 ? ratio : 0;
          if (score > closestScore) { closestScore = score; closestFile = file; }
        }
        if (closestScore >= 0.5 && closestFile) {
          targetFile = closestFile;
          console.log(`🔀 Type ${t.typeName} redirigé vers le DTO existant ${targetFile} (domaine "${t.domain}" proche).`);
        } else if (this.knownEntities.has(t.domain) || DOMAIN_MAP[t.typeName]) {
          targetFile = path.join(entitiesDir, t.domain + 'DTO.ts');
          console.log(`📄 Création d'un nouveau fichier ${targetFile} pour l'entité ${t.domain}.`);
        } else {
          console.log(`⚠️ Type ${t.typeName} ignoré (domaine "${t.domain}" non reconnu et aucun DTO proche).`);
          continue;
        }
      }

      if (path.resolve(targetFile) === path.resolve(t.sourceFile)) continue;

      importPaths.set(t.typeName, `@/dtos/entities/${path.basename(targetFile, '.ts')}`);
      if (!fileMap.has(targetFile)) fileMap.set(targetFile, []);
      fileMap.get(targetFile).push(t);
      if (!this.options.dryRun) this.report.movedTypes.push({ type: t.typeName, from: t.sourceFile, to: targetFile });
    }

    const sourceFileModifications = new Map();
    for (const t of this.dtoTypesToReconcile) {
      if (!sourceFileModifications.has(t.sourceFile)) {
        sourceFileModifications.set(t.sourceFile, fs.readFileSync(t.sourceFile, 'utf8'));
      }
      let srcContent = sourceFileModifications.get(t.sourceFile);
      const before = srcContent.substring(0, t.region.start).replace(/(\s*)export\s+$/, '$1');
      const after = srcContent.substring(t.region.end + 1);
      srcContent = before + after;
      srcContent = srcContent.replace(/\n{3,}/g, '\n\n').trim();
      sourceFileModifications.set(t.sourceFile, srcContent);
    }

    for (const [targetFile, types] of fileMap.entries()) {
      const existing = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : '';
      let newContent = existing ? existing.trimEnd() : '// Auto-generated DTO\n';
      for (const t of types) {
        const relPath = path.relative(this.projectRoot, t.sourceFile);
        newContent += `\n// Moved from ${relPath} (reconciled)\n${t.camel}\n`;
      }
      if (!this.options.dryRun) fs.writeFileSync(targetFile, newContent, 'utf8');
      else console.log(`[DRY RUN] Would update ${targetFile}`);
      console.log(`🔄 Réconciliation : ${types.map(t => t.typeName).join(', ')} → ${targetFile}`);
    }

    if (!this.options.dryRun) {
      for (const [srcFile, content] of sourceFileModifications) {
        fs.writeFileSync(srcFile, content, 'utf8');
        this.fileContentsCache.set(srcFile, content);
      }
    }

    for (const t of this.dtoTypesToReconcile) {
      const newPath = importPaths.get(t.typeName);
      if (newPath) {
        this.updateImportsAcrossFiles(t.typeName, newPath, t.sourceFile);
      }
    }
  }

  /* ===================================================================
     MISE À JOUR DES IMPORTS
     =================================================================== */
  updateImportsAcrossFiles(typeName, newImportPath, sourceFilePath) {
    const allFiles = this.collectAllFiles(path.join(this.projectRoot, 'src'));
    for (const filePath of allFiles) {
      if (filePath === sourceFilePath) continue;
      let content = this.fileContentsCache.get(filePath) || fs.readFileSync(filePath, 'utf8');
      const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
      let m, modified = false;
      while ((m = importRegex.exec(content)) !== null) {
        const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
        const oldPath = m[2];
        if (!names.includes(typeName)) continue;
        const resolved = this.resolveImportPath(oldPath, filePath);
        if (resolved === sourceFilePath) {
          content = content.replace(m[0], `import { ${typeName} } from '${newImportPath}';`);
          modified = true;
        }
      }
      if (modified && !this.options.dryRun) { fs.writeFileSync(filePath, content, 'utf8'); this.fileContentsCache.set(filePath, content); console.log(`🔁 Mise à jour import dans ${filePath}`); }
      else if (modified) console.log(`[DRY RUN] Would update imports in ${filePath}`);
    }
  }

  /* ===================================================================
     UTILITAIRES
     =================================================================== */
  collectAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && !file.startsWith('.')) this.collectAllFiles(full, fileList);
      else if (/\.(ts|tsx|js|jsx)$/.test(file)) fileList.push(full);
    }
    return fileList;
  }

  collectSeedFiles(dir, fileList = []) { return this.collectAllFiles(dir, fileList); }

  resolveImportPath(importPath, currentFilePath) {
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) return null;
    let target = importPath.startsWith('@/') ? path.join(this.projectRoot, importPath.replace('@/', 'src/')) : path.resolve(path.dirname(currentFilePath), importPath);
    const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    for (const ext of exts) {
      const full = target + ext;
      if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
    }
    return null;
  }

  /* ===================================================================
     RAPPORTS & CLI
     =================================================================== */
  runTypeScriptCheck() {
    console.log('\n🔍 Vérification TypeScript (npx tsc --noEmit)...');
    try {
      execSync('npx tsc --noEmit', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log('✅ Aucune erreur TypeScript détectée.');
    } catch (e) {
      console.log('❌ Erreurs TypeScript :');
      console.log(e.stdout?.toString() || e.stderr?.toString() || e.message);
    }
  }

  generateTextReport() {
    let out = '============================================================\n';
    out += '📊 RAPPORT DE CONFORMITÉ ARCHITECTURALE (P0 - CRITIQUE)\n';
    out += '============================================================\n';
    out += `Date/Heure: ${this.report.timestamp}\n`;
    out += `Fichiers analysés: ${this.report.stats.filesScanned}\n`;
    out += `\n🚨 P0 - CRITIQUES:\n`;
    out += `   Violations P0: ${this.report.stats.p0Violations}\n`;
    out += `   - Méthodes non finalisées (TODO/NotImplemented): ${this.countViolationsByRule('P0-M001')}\n`;
    out += `   - Appels Supabase dans UI: ${this.countViolationsByRule('P0-DB001')}\n`;
    out += `   - Types 'any': ${this.countViolationsByRule('P0-ANY001')}\n`;
    out += `   - Appels Supabase directs: ${this.countViolationsByRule('P0-SUP001')}\n`;
    out += `\n📊 Statistiques:\n`;
    out += `   Erreurs: ${this.report.stats.errors}  Avertissements: ${this.report.stats.warnings}\n`;
    out += `   Doublons: ${this.report.stats.duplicatesFound}  Corrigés: ${this.report.stats.fixed}\n`;
    out += `   Mocks supprimés: ${this.report.stats.mocksRemoved}  Types déplacés: ${this.report.stats.typesMoved}\n`;
    out += `   Types consolidés: ${this.report.stats.typesConsolidated}\n`;
    out += '============================================================\n\n';
    
    if (this.options.scoring && this.report.fileScores.length > 0) {
      const avgScore = this.report.fileScores.reduce((s, f) => s + f.score, 0) / this.report.fileScores.length;
      out += `📈 SCORE MOYEN: ${avgScore.toFixed(0)}/100\n\n`;
      
      const sorted = [...this.report.fileScores].sort((a, b) => a.score - b.score);
      out += '🚨 FICHIERS À CORRIGER EN PRIORITÉ:\n';
      for (const file of sorted.slice(0, 10)) {
        out += `   ${file.file} (${file.score}/100) - ${file.violations} violations (${file.p0Violations || 0} P0)\n`;
      }
      out += '\n';
    }
    
    if (this.report.violations.length) {
      const sortedViolations = [...this.report.violations].sort((a, b) => {
        const aP0 = a.violations.some(v => v.ruleId && v.ruleId.startsWith('P0'));
        const bP0 = b.violations.some(v => v.ruleId && v.ruleId.startsWith('P0'));
        return (bP0 ? 1 : 0) - (aP0 ? 1 : 0);
      });
      
      out += '📋 VIOLATIONS DÉTECTÉES:\n';
      for (const v of sortedViolations) {
        const hasP0 = v.violations.some(i => i.ruleId && i.ruleId.startsWith('P0'));
        out += `${hasP0 ? '🚨' : '📄'} ${v.file}\n`;
        for (const i of v.violations) {
          const isP0 = i.ruleId && i.ruleId.startsWith('P0');
          out += `  ${isP0 ? '🚨' : '  '} [${i.ruleId}] L${i.line}: ${i.message}\n`;
        }
        out += '\n';
      }
    } else out += '✨ Aucun problème détecté.\n';
    
    if (this.report.movedTypes.length) {
      out += '\n🚚 TYPES DÉPLACÉS :\n';
      for (const mt of this.report.movedTypes) out += `- ${mt.type} : ${path.relative(this.projectRoot, mt.from)} → ${path.relative(this.projectRoot, mt.to)}\n`;
    }
    
    if (this.report.duplicates && this.report.duplicates.length) {
      out += '\n🧬 TYPES DUPLIQUÉS :\n';
      for (const d of this.report.duplicates) {
        out += `- ${d.typeName} (${d.locations.length} occurrences): ${d.locations.map(l => `${l.file}:${l.line}`).join(', ')}\n`;
      }
    }
    
    if (this.report.consolidatedTypes && this.report.consolidatedTypes.length) {
      out += '\n🔧 TYPES CONSOLIDÉS :\n';
      for (const ct of this.report.consolidatedTypes) {
        out += `- ${ct.typeName} : ${ct.from.map(f => path.relative(this.projectRoot, f)).join(', ')} → ${path.relative(this.projectRoot, ct.to)}\n`;
      }
    }
    
    return out;
  }

  countViolationsByRule(ruleId) {
    let count = 0;
    for (const v of this.report.violations) {
      for (const i of v.violations) {
        if (i.ruleId === ruleId) count++;
      }
    }
    return count;
  }

  saveReportIfNeeded() {
    if (this.options.output) {
      const p = path.resolve(this.options.output);
      const data = this.options.json ? JSON.stringify(this.report, null, 2) : this.generateTextReport();
      fs.writeFileSync(p, data, 'utf8');
      console.log(`\n💾 Rapport enregistré : \x1b[32m${p}\x1b[0m\n`);
    }
  }

  /* ===================================================================
     EXÉCUTION PRINCIPALE
     =================================================================== */
  run() {
    console.log(`\n🔍 Analyse architecturale (P0 - CRITIQUE)...\n`);
    const visited = new Set(), queue = [];
    const seedDirs = ['src/pages', 'src/components', 'src/application', 'src/domain', 'src/infrastructure', 'src/dtos', 'src/hooks'];
    let count = 0;
    for (const d of seedDirs) {
      const full = path.join(this.projectRoot, d);
      if (fs.existsSync(full)) {
        const before = queue.length;
        this.collectSeedFiles(full, queue);
        console.log(`📌 ${d}/ → ${queue.length - before} fichiers`);
        count += queue.length - before;
      } else console.log(`⚠️ ${d} introuvable`);
    }
    if (count === 0) { console.error('❌ Aucun fichier trouvé'); process.exit(1); }
    console.log(`📦 Total entrées : ${count}\n`);

    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      const content = this.analyzeFile(cur);
      const impRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      let m;
      while ((m = impRegex.exec(content)) !== null) {
        const resolved = this.resolveImportPath(m[1], cur);
        if (resolved && !visited.has(resolved)) queue.push(resolved);
      }
    }

    if (this.options.consolidateDuplicates) {
      this.consolidateDuplicates();
    }

    if (this.options.moveTypes && this.typesToMove.length) {
      this.moveMisplacedTypes();
    }

    this.reconcileDtoFiles();
    if (this.options.moveTypes && this.dtoTypesToReconcile.length) {
      this.applyDtoReconciliation();
    }

    if (this.options.tsCheck) this.runTypeScriptCheck();

    this.finalizeDuplicateReport();
    this.report.stats.typesMoved = this.report.movedTypes.length;

    if (this.options.json && !this.options.output) console.log(JSON.stringify(this.report, null, 2));
    else console.log(this.generateTextReport());

    this.saveReportIfNeeded();

    const failOn = this.options.failOn || 'error';
    if (failOn === 'error' && (this.report.stats.errors > 0 || this.report.stats.p0Violations > 0)) {
      process.exitCode = 1;
    } else if (failOn === 'warning' && (this.report.stats.errors > 0 || this.report.stats.warnings > 0 || this.report.stats.p0Violations > 0)) {
      process.exitCode = 1;
    }
  }

  /* ===================================================================
     FINALISATION DU RAPPORT DE DUPLICATS
     =================================================================== */
  finalizeDuplicateReport() {
    const duplicateEntries = [];
    for (const [name, locations] of this.typeDeclarationsByName.entries()) {
      const uniqueFiles = [...new Set(locations.map(l => l.file))];
      if (uniqueFiles.length < 2) continue;
      duplicateEntries.push({
        typeName: name,
        locations: locations.map(l => ({ file: path.relative(this.projectRoot, l.file), line: l.line }))
      });
    }
    this.report.duplicates = duplicateEntries;
    this.report.stats.duplicatesFound = duplicateEntries.length;
    this.report.stats.errors += duplicateEntries.length;
    for (const entry of duplicateEntries) {
      const filesList = entry.locations.map(l => `${l.file}:${l.line}`).join(', ');
      this.report.violations.push({
        file: entry.locations[0].file,
        violations: [{
          ruleId: 'D001', 
          priority: 2, 
          severity: 'ERROR',
          message: `❌ [D001] Type dupliqué "${entry.typeName}" trouvé dans ${entry.locations.length} emplacements: ${filesList}`,
          line: entry.locations[0].line, 
          match: entry.typeName
        }]
      });
    }
  }
}

// ==========================================
// CLI
// ==========================================
async function askConfirmation(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(q, a => { rl.close(); resolve(a.toLowerCase() === 'o' || a.toLowerCase() === 'oui'); }));
}

const args = process.argv.slice(2);

function getArgValue(flag) {
  const exact = args.indexOf(flag);
  if (exact !== -1) return args[exact + 1];
  const prefixed = args.find(a => a.startsWith(`${flag}=`));
  if (prefixed) return prefixed.slice(flag.length + 1);
  return null;
}

const failOnValue = getArgValue('--fail-on');
const ruleValue = getArgValue('--rule');

const options = {
  fix: args.includes('--fix'),
  cleanMocks: args.includes('--clean-mocks'),
  dryRun: args.includes('--dry-run'),
  json: args.includes('--json'),
  output: getArgValue('--output'),
  interactive: args.includes('--interactive'),
  moveTypes: args.includes('--move-types'),
  tsCheck: args.includes('--ts-check'),
  scoring: args.includes('--scoring'),
  consolidateDuplicates: args.includes('--consolidate-duplicates'),
  semanticAnalysis: args.includes('--semantic-analysis'),
  failOn: ['error', 'warning', 'none'].includes(failOnValue) ? failOnValue : 'error',
  ruleFilter: ruleValue ? ruleValue.split(',').map(r => r.trim()).filter(Boolean) : null
};

(async () => {
  if (options.interactive) {
    console.log('🔎 Mode interactif...\n');
    const dry = new SmartHexAnalyzer({ ...options, fix: false, dryRun: true, moveTypes: false, tsCheck: false });
    dry.run();
    if (dry.typesToMove.length || dry.dtoTypesToReconcile.length) options.moveTypes = await askConfirmation('❓ Déplacer les types mal placés ? (o/n) ');
    if (dry.report.duplicates.length) options.consolidateDuplicates = await askConfirmation('❓ Consolider les types dupliqués ? (o/n) ');
    const fixConfirm = await askConfirmation('❓ Appliquer les corrections automatiques ? (o/n) ');
    if (fixConfirm || options.moveTypes || options.consolidateDuplicates) {
      console.log('\n🔧 Application...\n');
      const fixer = new SmartHexAnalyzer({ ...options, fix: fixConfirm, dryRun: false, moveTypes: options.moveTypes, tsCheck: options.tsCheck });
      fixer.run();
    } else console.log('❎ Aucune modification.');
  } else {
    new SmartHexAnalyzer(options).run();
  }
})();