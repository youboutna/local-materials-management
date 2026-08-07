#!/usr/bin/env node
/**
 * 🧠 ADVANCED HEXAGONAL ARCHITECTURE ANALYZER & REFACTORER (UI FIRST + RULES R001-R010)
 * 
 * Ordre de priorité des règles :
 *   - P0 : Appels DB / Supabase dans l'UI & Requêtes directes (R003, R008)
 *   - P1 : Hooks, DTOs, Types, Services, Injection et Transformers (R001, R002, R004, R006, R007, R009, R010)
 *   - P3 : Type 'any' (Dernière priorité) (R005)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURATION DES RÈGLES (R001 - R010)
// ==========================================

const RULES = {
  // Règle 1: Pas d'imports legacy services
  LEGACY_SERVICES: {
    id: 'R001',
    priority: 1,
    name: 'No legacy service imports',
    severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/services\/([^'"]+)['"]/g,
    message: '❌ [R001] Import from legacy @/services/ detected. Use @/application/services/ instead.',
    isAutoFixable: true,
    fix: (match) => match.replace(/@\/services\//g, '@/application/services/')
  },

  // Règle 2: Pas d'imports types legacy
  LEGACY_TYPES: {
    id: 'R002',
    priority: 1,
    name: 'No legacy type imports',
    severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/types\/([^'"]+)['"]/g,
    message: '❌ [R002] Import from legacy @/types/ detected. Use @/dtos/ instead.',
    isAutoFixable: true,
    fix: (match) => match.replace(/@\/types\//g, '@/dtos/entities/')
  },

  // Règle 3: Pas d'appels supabase direct (hors adapters) -> P0
  DIRECT_SUPABASE: {
    id: 'R003',
    priority: 0,
    name: 'No direct supabase calls',
    severity: 'ERROR',
    target: 'UI',
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.(select|insert|update|delete)/g,
    message: '❌ [R003] Direct supabase.from() call detected in UI/Component. Use repository pattern via adapters.',
    isAutoFixable: false,
    requiresSkeleton: true,
    exclude: ['src/infrastructure/supabase/adapters/', 'src/integrations/supabase/']
  },

  // Règle 4: Pas de snake_case dans les identifiants TS (hors strings)
  SNAKE_CASE_IDENTIFIER: {
    id: 'R004',
    priority: 1,
    name: 'No snake_case identifiers',
    severity: 'WARNING',
    pattern: /\b([a-z]+_[a-z]+(?:_[a-z]+)*)\b/g,
    message: '⚠️ [R004] Snake_case identifier detected. Use camelCase instead.',
    isAutoFixable: true,
    fix: (match) => match.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
    exclude: ['"', "'", '//', '/*', '*/', '`']
  },

  // Règle 5: Pas de 'any' types -> Dernière priorité (P3)
  ANY_TYPE: {
    id: 'R005',
    priority: 3,
    name: 'No any types',
    severity: 'ERROR',
    pattern: /:\s*any\b/g,
    message: '❌ [R005] "any" type detected. Use specific DTO or domain types.',
    isAutoFixable: false,
    exclude: ['node_modules/', 'dist/', 'build/']
  },

  // Règle 6: Pas de hooks non-hexagonaux (useXxx sans Hex)
  NON_HEX_HOOK: {
    id: 'R006',
    priority: 1,
    name: 'Use hexagonal hooks',
    severity: 'WARNING',
    pattern: /export\s+function\s+use(\w+)\(/g,
    message: '⚠️ [R006] Hook "use$1" might not be hexagonal. Consider using use$1Hex pattern.',
    isAutoFixable: true,
    fix: (match, name) => {
      if (!name.endsWith('Hex')) {
        return match.replace(/use(\w+)\(/, (_, n) => `use${n}Hex(`);
      }
      return match;
    },
    exclude: ['useProjectsHex', 'useProjectWorkflowHex', 'useProjectEditHex', 'usePhasesHex']
  },

  // Règle 7: Pas de DTOs snake_case
  DTO_SNAKE_CASE: {
    id: 'R007',
    priority: 1,
    name: 'DTOs must use camelCase',
    severity: 'ERROR',
    pattern: /interface\s+\w+DTO\s*{([^}]*?)(\w+_\w+)/g,
    message: '❌ [R007] Snake_case field in DTO. Use camelCase instead.',
    isAutoFixable: true,
    fix: (match, before, field) => {
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      return match.replace(field, camelField);
    }
  },

  // Règle 8: Pas de DB calls dans les composants UI -> P0
  DB_IN_COMPONENT: {
    id: 'R008',
    priority: 0,
    name: 'No DB calls in UI components',
    severity: 'ERROR',
    target: 'UI',
    pattern: /(?:await\s+)?(?:supabase|db|database)\.\w+\(/g,
    message: '❌ [R008] Database call detected in UI component/page. Move to application service layer.',
    isAutoFixable: false,
    exclude: ['src/hooks/', 'src/application/', 'src/infrastructure/', 'src/dtos/', 'src/domain/']
  },

  // Règle 9: Pas de références aux services legacy
  LEGACY_SERVICE_REF: {
    id: 'R009',
    priority: 1,
    name: 'No legacy service references',
    severity: 'ERROR',
    pattern: /new\s+(\w+Service)\(/g,
    message: '❌ [R009] Legacy service instantiation detected. Use dependency injection.',
    isAutoFixable: false,
    exclude: ['src/application/', 'src/infrastructure/']
  },

  // Règle 10: Validation des transformers
  TRANSFORMER_COMPLETENESS: {
    id: 'R010',
    priority: 1,
    name: 'Transformer must implement all methods',
    severity: 'WARNING',
    pattern: /class\s+(\w+)Transformer\s*{([^}]*)}/gs,
    message: '⚠️ [R010] Transformer missing required methods (fromSupabase, toSupabase, toDTO, fromDTO)',
    isAutoFixable: false,
    check: (content) => {
      const methods = ['fromSupabase', 'toSupabase', 'toDTO', 'fromDTO'];
      const missing = methods.filter(m => !content.includes(m));
      return missing.length > 0 ? `Missing: ${missing.join(', ')}` : null;
    }
  }
};

// ==========================================
// MOTEUR D'ANALYSE INTELLIGENT (UI FIRST)
// ==========================================

class SmartHexAnalyzer {
  constructor(options = {}) {
    this.options = {
      fix: options.fix || false,
      generateSkeletons: options.generateSkeletons || false,
      dryRun: options.dryRun || false,
      json: options.json || false,
      file: options.file || null,
      ...options
    };
    this.report = {
      timestamp: new Date().toISOString(),
      stats: { filesScanned: 0, errors: 0, warnings: 0, fixed: 0, skeletonsGenerated: 0 },
      violations: []
    };
  }

  shouldExclude(filePath, rule) {
    if (!rule.exclude) return false;
    return rule.exclude.some(pattern => filePath.includes(pattern));
  }

  isInStringOrComment(content, position) {
    const before = content.substring(0, position);
    const lines = before.split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine.includes('//')) return true;
    const quotes = (before.match(/['"`]/g) || []).length;
    return quotes % 2 !== 0;
  }

  analyzeFile(filePath) {
    this.report.stats.filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileModified = false;
    const fileViolations = [];

    // Identification fine des composants et pages UI (basée sur App.tsx et la structure du projet)
    const isUIFile = 
      filePath.includes('src/pages') || 
      filePath.includes('src/components') || 
      filePath.includes('App.tsx');

    const sortedRules = Object.entries(RULES).sort((a, b) => a[1].priority - b[1].priority);

    for (const [key, rule] of sortedRules) {
      if (rule.target === 'UI' && !isUIFile) continue;
      if (this.shouldExclude(filePath, rule)) continue;

      // Gestion spécifique pour R010 (validation des méthodes du transformer)
      if (rule.check && rule.pattern.test(content)) {
        rule.pattern.lastIndex = 0;
        let match;
        while ((match = rule.pattern.exec(content)) !== null) {
          const checkResult = rule.check(match[2]);
          if (checkResult) {
            const line = content.substring(0, match.index).split('\n').length;
            fileViolations.push({
              ruleId: rule.id,
              priority: rule.priority,
              severity: rule.severity,
              message: `${rule.message} (${checkResult})`,
              line,
              match: match[1]
            });
            this.report.stats.warnings++;
          }
        }
      }

      // Analyse standard par expression régulière
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(content)) !== null) {
        if (rule.exclude?.includes('`') && this.isInStringOrComment(content, match.index)) continue;

        const line = content.substring(0, match.index).split('\n').length;
        const violation = {
          ruleId: rule.id,
          priority: rule.priority,
          severity: rule.severity,
          message: rule.message,
          line,
          match: match[0],
          entityName: match[1] || null
        };

        fileViolations.push(violation);
        if (rule.severity === 'ERROR') this.report.stats.errors++;
        else this.report.stats.warnings++;

        // Auto-correction si activée
        if (this.options.fix && rule.isAutoFixable && rule.fix) {
          const replacement = typeof rule.fix === 'function' ? rule.fix(match[0], match[1], match[2]) : rule.fix;
          if (replacement && replacement !== match[0]) {
            modifiedContent = modifiedContent.replace(match[0], replacement);
            fileModified = true;
            this.report.stats.fixed++;
          }
        }

        // Génération de squelettes d'architecture pour les appels DB directs détectés dans l'UI
        if (this.options.generateSkeletons && rule.requiresSkeleton && match[1]) {
          this.generateArchitecturalSkeleton(match[1]);
        }
      }
    }

    if (fileViolations.length > 0) {
      // Tri des violations par priorité dans le rapport fichier
      fileViolations.sort((a, b) => a.priority - b.priority);
      this.report.violations.push({ file: filePath, violations: fileViolations });
    }

    if (fileModified && !this.options.dryRun) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
    }
  }

  generateArchitecturalSkeleton(tableName) {
    const capitalized = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/s$/, '');
    const dtoDir = path.resolve('src/dtos');
    const repoDir = path.resolve('src/infrastructure/supabase/adapters');
    const serviceDir = path.resolve('src/application/services');

    [dtoDir, repoDir, serviceDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const dtoPath = path.join(dtoDir, `${capitalized}DTO.ts`);
    if (!fs.existsSync(dtoPath)) {
      const dtoContent = `export interface ${capitalized}DTO {\n  id: string;\n  createdAt: string;\n  updatedAt: string;\n}\n`;
      if (!this.options.dryRun) fs.writeFileSync(dtoPath, dtoContent);
      this.report.stats.skeletonsGenerated++;
    }

    const repoPath = path.join(repoDir, `Supabase${capitalized}Repository.ts`);
    if (!fs.existsSync(repoPath)) {
      const repoContent = `import { supabase } from '@/integrations/supabase/client';\nimport { ${capitalized}DTO } from '@/dtos/${capitalized}DTO';\n\nexport class Supabase${capitalized}Repository {\n  async findAll(): Promise<${capitalized}DTO[]> {\n    const { data, error } = await supabase.from('${tableName}').select('*');\n    if (error) throw error;\n    return data as ${capitalized}DTO[];\n  }\n}\n`;
      if (!this.options.dryRun) fs.writeFileSync(repoPath, repoContent);
      this.report.stats.skeletonsGenerated++;
    }

    const servicePath = path.join(serviceDir, `${capitalized}Service.ts`);
    if (!fs.existsSync(servicePath)) {
      const serviceContent = `import { Supabase${capitalized}Repository } from '@/infrastructure/supabase/adapters/Supabase${capitalized}Repository';\n\nexport class ${capitalized}Service {\n  constructor(private repo: Supabase${capitalized}Repository) {}\n\n  async get${capitalized}s() {\n    return this.repo.findAll();\n  }\n}\n`;
      if (!this.options.dryRun) fs.writeFileSync(servicePath, serviceContent);
      this.report.stats.skeletonsGenerated++;
    }
  }

  collectFiles(dir, uiFiles = [], otherFiles = []) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(file)) {
          this.collectFiles(fullPath, uiFiles, otherFiles);
        }
      } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        if (fullPath.includes('src/pages') || fullPath.includes('src/components')) {
          uiFiles.push(fullPath);
        } else {
          otherFiles.push(fullPath);
        }
      }
    }
  }

  run(targetPaths = ['src']) {
    console.log(`\n🧠 Analyse Hexagonale Intelligente (Scan Prioritaire UI -> Autres couches -> Type Any en P3)...\n`);
    
    if (this.options.file) {
      if (fs.existsSync(this.options.file)) this.analyzeFile(this.options.file);
    } else {
      const uiFiles = [], otherFiles = [];
      targetPaths.forEach(target => this.collectFiles(target, uiFiles, otherFiles));

      console.log(`⚡ Étape 1 : Scan prioritaire des Pages & Composants UI (${uiFiles.length} fichiers trouvés)`);
      uiFiles.forEach(f => this.analyzeFile(f));

      console.log(`⚡ Étape 2 : Scan des autres couches d'infrastructure, application et domaines (${otherFiles.length} fichiers)\n`);
      otherFiles.forEach(f => this.analyzeFile(f));
    }

    if (this.options.json) {
      console.log(JSON.stringify(this.report, null, 2));
      return;
    }

    console.log('='.repeat(60));
    console.log(`📊 RAPPORT D'ANALYSE DE CONFORMITÉ ARCHITECTURALE`);
    console.log('='.repeat(60));
    console.log(`- Fichiers analysés     : ${this.report.stats.filesScanned}`);
    console.log(`- Erreurs détectées     : ${this.report.stats.errors}`);
    console.log(`- Avertissements        : ${this.report.stats.warnings}`);
    console.log(`- Violations corrigées  : ${this.report.stats.fixed}`);
    console.log(`- Squelettes générés    : ${this.report.stats.skeletonsGenerated}`);
    console.log('='.repeat(60) + '\n');

    if (this.report.violations.length > 0) {
      this.report.violations.forEach(v => {
        console.log(`📄 \x1b[36m${v.file}\x1b[0m`);
        v.violations.forEach(iss => {
          const color = iss.severity === 'ERROR' ? '\x1b[31m' : '\x1b[33m';
          console.log(`  ${color}[${iss.ruleId}] Ligne ${iss.line}: ${iss.message}\x1b[0m`);
        });
        console.log('');
      });
    } else {
      console.log(`\x1b[32m✨ Aucune violation détectée ! L'architecture est totalement conforme.\x1b[0m\n`);
    }
  }
}

// ==========================================
// CLI & EXÉCUTION
// ==========================================

const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  generateSkeletons: args.includes('--generate-skeletons'),
  dryRun: args.includes('--dry-run'),
  json: args.includes('--json'),
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : null
};

new SmartHexAnalyzer(options).run();