#!/usr/bin/env node
/**
 * 🧠 ADVANCED HEXAGONAL ARCHITECTURE ANALYZER & DEPENDENCY TRACER (v28 – Final)
 *
 * Analyse le code en suivant l’arbre des dépendances.
 * Priorités : P0 (DB) → P1 (types hors domain/dtos, mapping) → P2 (snake_case) → P3 (any).
 *
 * 🔧 INTELLIGENCE AMÉLIORÉE :
 *   - Détection automatique des entités métier (domain/entities + repositories).
 *   - Index global des types déjà présents dans les DTO existants.
 *   - Résolution du domaine enrichie (heuristiques de mots‑clés, contexte fichier…).
 *   - **Fusion automatique** : un type qui doit être déplacé sera toujours ajouté
 *     à un fichier DTO existant (le plus proche par similarité), sauf si aucun
 *     fichier DTO pertinent n’existe (création en dernier recours).
 *   - Réconciliation des DTO existants (déplacement des types mal classés).
 *   - Noms de fichiers en CamelCaseDTO.ts, ignorés les props React.
 *   - Option `--clean-mocks` ne touche pas aux TODO.
 *
 * Utilisation :
 *   node fix-hexagonal-violations.js [--fix] [--interactive] [--move-types] [--dry-run]
 *                         [--json] [--output file] [--ts-check] [--clean-mocks]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// RÈGLES (inchangées pour la plupart, identiques à v27)
// ==========================================
const RULES = {
  DIRECT_SUPABASE: {
    id: 'R003', priority: -1, severity: 'ERROR',
    pattern: /supabase\.(?:from\(['"]([^'"]+)['"]\)\.(?:select|insert|update|delete|upsert|eq|neq|in|order|limit|single|maybeSingle)|rpc\(['"]([^'"]+)['"]|functions\.invoke\(['"]([^'"]+)['"]|channel\(['"]([^'"]+)['"])/g,
    message: '🚨 [R003] Direct supabase call detected. Use repository pattern via adapters.',
    isAutoFixable: false,
    exclude: ['src/infrastructure/', 'src/integrations/'],
    contextMap: { /* … (inchangé) … */ }
  },
  DB_IN_COMPONENT: {
    id: 'R008', priority: -1, severity: 'ERROR', target: 'UI',
    pattern: /(?:await\s+)?(?:supabase|db|database)\.\w+\(/g,
    message: '🚨 [R008] Database call in UI component.',
    isAutoFixable: false,
    exclude: ['src/hooks/', 'src/application/', 'src/infrastructure/', 'src/dtos/', 'src/domain/']
  },
  MISSING_IMPLEMENTATION: {
    id: 'R013', priority: 0, severity: 'WARNING',
    pattern: /(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>\s*{\s*}|throw\s+new\s+Error\(['"`](?:Not implemented|TODO).*?['"`]\)/gi,
    message: '⚠️ [R013] Missing implementation.',
    isAutoFixable: true,
    fix: m => m.includes('throw new Error') ? m : m.replace(/{\s*}/, '{ /* TODO */ }'),
    exclude: ['src/test/', 'src/__tests__/', '.spec.', '.test.']
  },
  HARDCODED_MOCK_STORE: {
    id: 'R011', priority: 0, severity: 'ERROR',
    pattern: /(?:const|let|var)\s+(\w*(?:mock|fake|stub|dummy|hardcoded)\w*)\s*[:=]/gi,
    message: '❌ [R011] Mock/fake data variable: "$1".',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/', '.spec.', '.test.', 'node_modules/']
  },
  MOCK_CORE_LOGIC: {
    id: 'R012', priority: 0, severity: 'ERROR',
    pattern: /\/\/\s*(?:Mock|Hardcoded|Stub|Fake|Temporary|Placeholder|Replace|TODO: implement|TODO: replace)/gi,
    message: '❌ [R012] Mock/hardcoded comment.',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/']
  },
  STATIC_MOCK_DATA: {
    id: 'R017', priority: 0, severity: 'WARNING',
    pattern: /(?:const|let|var)\s+(\w*(?:mock|fake|dummy|sample|stub)\w*)\s*[:=]/gi,
    message: '⚠️ [R017] Possible static mock data in "$1".',
    isAutoFixable: false,
    exclude: ['src/test/', 'src/__tests__/', 'src/config/', 'src/domain/', 'src/dtos/'],
    check: (content, varName) => {
      if (!/(mock|fake|dummy|sample|stub)/i.test(varName)) return null;
      return `Identifier "${varName}" looks like mock data.`;
    }
  },
  LEGACY_SERVICES: {
    id: 'R001', priority: 1, severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/services\/([^'"]+)['"]/g,
    message: '❌ [R001] Legacy service import.',
    isAutoFixable: true, fix: m => m.replace(/@\/services\//g, '@/application/services/')
  },
  LEGACY_TYPES: {
    id: 'R002', priority: 1, severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/types\/([^'"]+)['"]/g,
    message: '❌ [R002] Legacy type import.',
    isAutoFixable: true, fix: m => m.replace(/@\/types\//g, '@/dtos/entities/')
  },
  TYPE_DEFINITION_LOCATION: {
    id: 'R016', priority: 1, severity: 'ERROR',
    pattern: /(?:^|\n)\s*export\s+(interface|type)\s+([A-Z]\w*)/gm,
    message: '❌ [R016] Type definition outside domain/dtos.',
    isAutoFixable: false,
    exclude: ['src/config/', 'src/integrations/supabase/types.ts'],
    checkFile: fp => {
      const n = fp.replace(/\\/g, '/');
      return !n.includes('/domain/') && !n.includes('/dtos/');
    }
  },
  TRANSFORM_FUNCTION_LOCATION: {
    id: 'R015', priority: 1, severity: 'ERROR',
    pattern: /(?:function\s+|const\s+|let\s+|var\s+)(fromRow|toRow|fromSupabase|toSupabase|mapFromDB|mapToDB|fromDb|toDb)\b/g,
    message: '❌ [R015] Mapping function outside dtos/transforms.',
    isAutoFixable: false,
    checkFile: fp => !fp.replace(/\\/g, '/').includes('/dtos/transforms/')
  },
  SNAKE_CASE_IDENTIFIER: {
    id: 'R004', priority: 2, severity: 'WARNING',
    pattern: /\b([a-z]+_[a-z]+(?:_[a-z]+)*)\b/g,
    message: '⚠️ [R004] Snake_case identifier.',
    isAutoFixable: true,
    fix: m => m.replace(/_([a-z])/g, (_, l) => l.toUpperCase()),
    exclude: ['src/infrastructure/', 'src/dtos/transforms/', 'src/test/', 'src/integrations/supabase/types.ts', 'supabase/'],
    skipIfInStringOrComment: true,
    skipIfObjectKey: true
  },
  NON_HEX_HOOK: {
    id: 'R006', priority: 1, severity: 'WARNING',
    pattern: /export\s+function\s+use(\w+)\(/g,
    message: '⚠️ [R006] Non hexagonal hook.',
    isAutoFixable: true,
    fix: (m, name) => name.endsWith('Hex') ? m : m.replace(/use(\w+)\(/, (_, n) => `use${n}Hex(`),
    exclude: ['useProjectsHex', 'useProjectWorkflowHex', 'useProjectEditHex', 'usePhasesHex']
  },
  DTO_SNAKE_CASE: {
    id: 'R007', priority: 1, severity: 'ERROR',
    pattern: /interface\s+\w+DTO\s*{([^}]*?)(\w+_\w+)/g,
    message: '❌ [R007] Snake_case in DTO.',
    isAutoFixable: true,
    fix: (m, _, field) => m.replace(field, field.replace(/_([a-z])/g, (_, l) => l.toUpperCase()))
  },
  LEGACY_SERVICE_REF: {
    id: 'R009', priority: 1, severity: 'ERROR',
    pattern: /new\s+(\w+Service)\(/g,
    message: '❌ [R009] Legacy service instantiation.',
    isAutoFixable: false, exclude: ['src/application/', 'src/infrastructure/']
  },
  TRANSFORMER_COMPLETENESS: {
    id: 'R010', priority: 1, severity: 'WARNING',
    pattern: /class\s+(\w+)Transformer\s*{([^}]*)}/gs,
    message: '⚠️ [R010] Transformer incomplete.',
    isAutoFixable: false,
    check: c => {
      const methods = ['fromSupabase', 'toSupabase', 'toDTO', 'fromDTO'];
      const missing = methods.filter(m => !c.includes(m));
      return missing.length > 0 ? `Missing: ${missing.join(', ')}` : null;
    },
    exclude: ['src/test/']
  },
  ANY_TYPE: {
    id: 'R005', priority: 3, severity: 'ERROR',
    pattern: /:\s*any\b/g,
    message: '❌ [R005] "any" type.',
    isAutoFixable: false, exclude: ['node_modules/', 'dist/', 'build/']
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

// Mapping explicite – enrichi pour éviter les fichiers parasites
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
  'CheckpointVerificationResultDTO': 'Milestone',   // ajout explicite
};

// Heuristiques de mots-clés (étendues)
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

// ==========================================
// ANALYSEUR PRINCIPAL
// ==========================================
class SmartHexAnalyzer {
  constructor(options = {}) {
    this.options = { fix: false, cleanMocks: false, dryRun: false, json: false, output: null, moveTypes: false, tsCheck: false, ruleFilter: null, failOn: 'none', ...options };
    this.report = {
      timestamp: new Date().toISOString(),
      stats: { filesScanned: 0, errors: 0, warnings: 0, fixed: 0, mocksRemoved: 0, duplicatesFound: 0, typesMoved: 0 },
      violations: [],
      movedTypes: [],
      duplicates: []
    };
    this.globalTypes = new Map();
    this.typeDeclarationsByName = new Map();
    this.typesToMove = [];                // types à déplacer depuis des fichiers hors DTO
    this.dtoTypesToReconcile = [];       // types mal placés dans des DTO existants
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
      path.join(this.projectRoot, 'src', 'dtos', 'workflows')
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const re = /export\s+(?:interface|type)\s+(\w+)/g;
        let m;
        while ((m = re.exec(content)) !== null) {
          if (!index.has(m[1])) index.set(m[1], filePath);
        }
      }
    }
    return index;
  }

  /* ===================================================================
     OUTILS DE BASE (identiques à v27)
     =================================================================== */
  shouldExclude(filePath, rule) { return rule.exclude?.some(p => filePath.includes(p)) ?? false; }
  shouldApplyFileRule(filePath, rule) { if (rule.checkFile && !rule.checkFile(filePath)) return false; return !this.shouldExclude(filePath, rule); }

  getTypeRegions(content) {
    const regions = [];
    const re = /\b(interface|type)\s+(\w+)/g;
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

  /**
   * Cherche le meilleur fichier DTO existant pour un type.
   * Si le type est déjà dans un DTO et que son domaine correspond, on retourne ce fichier.
   * Sinon, on cherche par domaine, puis par similarité avec tous les DTO existants.
   */
  findBestDtoFile(typeName, filePath, fileContent) {
    const existing = this.existingDtoTypes.get(typeName);
    if (existing) {
      const domain = this.resolveDomain(typeName, filePath, fileContent);
      if (domain) {
        const fileBase = path.basename(existing, path.extname(existing)).replace(/DTO$/i, '');
        if (fileBase.toLowerCase() === domain.toLowerCase()) return existing;
        console.log(`⚠️ Type ${typeName} trouvé dans ${existing} mais son domaine est "${domain}" → sera redirigé.`);
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

    // 1. Correspondance exacte du domaine
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const baseName = path.basename(file, path.extname(file)).replace(/DTO$/i, '');
        if (baseName.toLowerCase() === domain.toLowerCase()) return path.join(dir, file);
      }
    }

    // 2. Sous‑chaîne
    const lowerDomain = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const base = path.basename(file, path.extname(file)).replace(/DTO$/i, '').replace(/[^a-z0-9]/g, '').toLowerCase();
        if (lowerDomain.includes(base) || base.includes(lowerDomain)) return path.join(dir, file);
      }
    }

    // 3. LCS avec tous les fichiers DTO (priorité aux fichiers dont le nom est une entité connue)
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

    // 4. Aucun fichier pertinent → null (on évitera de créer un nouveau fichier dans moveMisplacedTypes)
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
    // Heuristic: treat as an object-literal key (e.g. DB payload construction) when the
    // matched identifier is immediately followed by a colon (not part of a ternary) and
    // is preceded (ignoring whitespace) by '{' or ',' — i.e. `{ some_field: value }`.
    const after = content.slice(m.index + m[0].length);
    const afterTrim = after.match(/^\s*/)[0].length;
    if (after[afterTrim] !== ':' ) return false;
    if (after[afterTrim + 1] === ':') return false; // type annotation `::`
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

  detectTypeDuplicates(filePath, content, fileViolations) {
    const re = /export\s+(?:interface|type)\s+([A-Z]\w+)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const name = m[1];
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
          ruleId: 'R014', priority: 2, severity: 'ERROR',
          message: `❌ [R014] Duplicate Type "${entry.typeName}" found in ${entry.locations.length} locations: ${filesList}`,
          line: entry.locations[0].line, match: entry.typeName
        }]
      });
    }
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
    for (const [key, val] of Object.entries(RULES.DIRECT_SUPABASE.contextMap)) {
      if (lastFuncName.includes(key.replace(/_/g, ''))) return { domain: key, suggestion: val };
    }
    return null;
  }

  /* ===================================================================
     ANALYSE D'UN FICHIER (identique à v27)
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
    if (!this.options.ruleFilter || this.options.ruleFilter.includes('R014')) {
      this.detectTypeDuplicates(filePath, content, fileViolations);
    }
    const sortedRules = Object.entries(RULES).sort((a, b) => a[1].priority - b[1].priority);

    for (const [key, rule] of sortedRules) {
      if (this.options.ruleFilter && !this.options.ruleFilter.includes(rule.id)) continue;
      if (rule.target === 'UI' && !isUIFile) continue;
      if (!this.shouldApplyFileRule(filePath, rule)) continue;

      if (rule.id === 'R017') {
        if (!this.shouldExclude(filePath, rule)) {
          rule.pattern.lastIndex = 0;
          let m;
          while ((m = rule.pattern.exec(content)) !== null) {
            const block = m[0], varName = m[1];
            const res = rule.check(block, varName);
            if (res) {
              const line = content.substring(0, m.index).split('\n').length;
              fileViolations.push({ ruleId: rule.id, priority: rule.priority, severity: rule.severity, message: `${rule.message} (${res})`, line, match: varName });
              this.report.stats.warnings++;
            }
          }
        }
        continue;
      }

      if (rule.check && rule.pattern.test(content)) {
        rule.pattern.lastIndex = 0;
        let m;
        while ((m = rule.pattern.exec(content)) !== null) {
          const res = rule.check(m[2]);
          if (res) {
            const line = content.substring(0, m.index).split('\n').length;
            fileViolations.push({ ruleId: rule.id, priority: rule.priority, severity: rule.severity, message: `${rule.message} (${res})`, line, match: m[1] });
            this.report.stats.warnings++;
          }
        }
      }

      rule.pattern.lastIndex = 0;
      let m;
      while ((m = rule.pattern.exec(modifiedContent)) !== null) {
        if (rule.id === 'R003' || rule.id === 'R008') hasDirectDbCall = true;
        const line = modifiedContent.substring(0, m.index).split('\n').length;
        if (rule.skipIfInStringOrComment && this.isInStringOrComment(modifiedContent, m.index)) continue;
        if (rule.skipIfObjectKey && this.isObjectKeyPosition(modifiedContent, m)) continue;

        if (rule.id === 'R004') {
          const inType = this.isInTypeRegion(m.index, typeRegions);
          const fileIsDomainOrDtos = this.isDomainOrDtosFile(filePath);
          if (inType && !fileIsDomainOrDtos) {
            const region = typeRegions.find(r => m.index >= r.start && m.index <= r.end);
            const violation = { ruleId: 'R004', priority: rule.priority, severity: 'ERROR', message: '❌ [R004] Snake_case field in type definition – move the entire type.', line, match: m[0], typeRegion: region };
            if (!fileViolations.some(v => v.line === line && v.ruleId === 'R004' && v.message.includes('move the entire type'))) {
              fileViolations.push(violation); this.report.stats.errors++;
            }
            continue;
          }
          if (inType && fileIsDomainOrDtos) {
            if (this.options.fix && rule.isAutoFixable && rule.fix) {
              const replacement = rule.fix(m[0]);
              if (replacement !== m[0]) { modifiedContent = modifiedContent.replace(m[0], replacement); fileModified = true; this.report.stats.fixed++; }
            } else {
              fileViolations.push({ ruleId: rule.id, priority: rule.priority, severity: rule.severity, message: rule.message, line, match: m[0] });
              this.report.stats.warnings++;
            }
            continue;
          }
          fileViolations.push({ ruleId: rule.id, priority: rule.priority, severity: 'WARNING', message: '⚠️ [R004] Snake_case identifier – may be DB field.', line, match: m[0] });
          this.report.stats.warnings++;
          continue;
        }

        if (rule.id === 'R016') {
          const typeName = m[2];
          if (typeName && /Props$/.test(typeName)) continue;
          const usageCount = (modifiedContent.match(new RegExp(`\\b${typeName}\\b`, 'g')) || []).length;
          if (usageCount <= 1) continue; // local-only type, used nowhere else in the file
        }

        let extraMsg = '';
        if (rule.id === 'R003') {
          const context = this.findContextDomain(modifiedContent, m.index);
          if (context) extraMsg = ` → Use ${context.suggestion}`;
        }

        const violation = { ruleId: rule.id, priority: rule.priority, severity: rule.severity, message: rule.message + extraMsg, line, match: m[0] };
        if (!fileViolations.some(v => v.line === line && v.ruleId === rule.id)) {
          fileViolations.push(violation);
          if (rule.severity === 'ERROR') this.report.stats.errors++; else this.report.stats.warnings++;
        }

        if (this.options.fix && rule.isAutoFixable && rule.fix && !(rule.id === 'R004' && this.isInTypeRegion(m.index, typeRegions))) {
          const repl = rule.fix(m[0], m[1], m[2], filePath);
          if (repl && repl !== m[0]) { modifiedContent = modifiedContent.replace(m[0], repl); fileModified = true; this.report.stats.fixed++; }
        }

        if (this.options.cleanMocks && (rule.id === 'R011' || rule.id === 'R012' || rule.id === 'R017')) {
          if (!/TODO/i.test(m[0])) {
            modifiedContent = modifiedContent.replace(m[0], '/* [CLEANED MOCK] */');
            fileModified = true;
            this.report.stats.mocksRemoved++;
          }
        }
      }
    }

    if (hasDirectDbCall) {
      fileViolations.forEach(v => { if (v.ruleId === 'R004') v.message += ' (ℹ️ probably DB→domain missing)'; });
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
     DÉPLACEMENT DES TYPES (amélioré – évite la création de fichiers)
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
        // Chercher n'importe quel fichier DTO existant dont le nom partage une sous-chaîne avec le domaine
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
          // Créer un nouveau fichier UNIQUEMENT si le domaine est une entité connue et aucun fichier proche
          dtoFile = path.join(entitiesDir, domain + 'DTO.ts');
          console.log(`📄 Création d'un nouveau fichier ${dtoFile} pour l'entité ${domain}.`);
        } else {
          console.log(`⚠️ Type ${t.typeName} ignoré (domaine "${domain}" non reconnu et aucun DTO proche).`);
          continue;
        }
      }

      // Anti‑doublon local
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

    // Écriture / ajout dans les DTO
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

    // Mise à jour des fichiers sources
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
     RÉCONCILIATION DES FICHIERS DTO EXISTANTS (identique à v27)
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
     MISE À JOUR DES IMPORTS (identique)
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
    out += '📊 RAPPORT DE CONFORMITÉ\n';
    out += '============================================================\n';
    out += `Date/Heure: ${this.report.timestamp}\n`;
    out += `Fichiers analysés: ${this.report.stats.filesScanned}\n`;
    out += `Erreurs: ${this.report.stats.errors}  Avertissements: ${this.report.stats.warnings}\n`;
    out += `Doublons: ${this.report.stats.duplicatesFound}  Corrigés: ${this.report.stats.fixed}\n`;
    out += `Mocks supprimés: ${this.report.stats.mocksRemoved}  Types déplacés: ${this.report.stats.typesMoved}\n`;
    out += '============================================================\n\n';
    if (this.report.violations.length) {
      for (const v of this.report.violations) {
        out += `📄 ${v.file}\n`;
        for (const i of v.violations) out += `  [${i.ruleId}] L${i.line}: ${i.message}\n`;
        out += '\n';
      }
    } else out += '✨ Aucun problème.\n';
    if (this.report.movedTypes.length) {
      out += '\n🚚 TYPES DÉPLACÉS :\n';
      for (const mt of this.report.movedTypes) out += `- ${mt.type} : ${path.relative(this.projectRoot, mt.from)} → ${path.relative(this.projectRoot, mt.to)}\n`;
    }
    return out;
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
    console.log(`\n🔍 Analyse depuis src/pages/*, src/components/*...\n`);
    const visited = new Set(), queue = [];
    const seedDirs = ['src/pages', 'src/components'];
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

    if (this.options.failOn === 'error' && this.report.stats.errors > 0) process.exitCode = 1;
    else if (this.options.failOn === 'warning' && (this.report.stats.errors > 0 || this.report.stats.warnings > 0)) process.exitCode = 1;
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
  failOn: ['error', 'warning', 'none'].includes(failOnValue) ? failOnValue : 'none',
  ruleFilter: ruleValue ? ruleValue.split(',').map(r => r.trim()).filter(Boolean) : null
};

(async () => {
  if (options.interactive) {
    console.log('🔎 Mode interactif...\n');
    const dry = new SmartHexAnalyzer({ ...options, fix: false, dryRun: true, moveTypes: false, tsCheck: false });
    dry.run();
    if (dry.typesToMove.length || dry.dtoTypesToReconcile.length) options.moveTypes = await askConfirmation('❓ Déplacer les types mal placés ? (o/n) ');
    const fixConfirm = await askConfirmation('❓ Appliquer les corrections automatiques ? (o/n) ');
    if (fixConfirm || options.moveTypes) {
      console.log('\n🔧 Application...\n');
      const fixer = new SmartHexAnalyzer({ ...options, fix: fixConfirm, dryRun: false, moveTypes: options.moveTypes, tsCheck: options.tsCheck });
      fixer.run();
    } else console.log('❎ Aucune modification.');
  } else {
    new SmartHexAnalyzer(options).run();
  }
})();