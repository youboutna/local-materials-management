/**
 * 🔍 HEXAGONAL ARCHITECTURE VIOLATION DETECTOR
 * Usage: node scripts/check-hexagonal-violations.js [--fix] [--json]
 *  🔍 HEXAGONAL ARCHITECTURE VIOLATION DETECTOR
 * Options:
 *   --fix    : Tente de corriger automatiquement (experimental)
 *   --json   : Sortie en format JSON
 *   --help   : Affiche l'aide
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// 1. CONFIGURATION DES RÈGLES
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES = {
  // Règle 1: Pas d'imports legacy services
  LEGACY_SERVICES: {
    id: 'R001',
    name: 'No legacy service imports',
    severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/services\/([^'"]+)['"]/g,
    message: '❌ Import from legacy @/services/ detected. Use @/application/services/ instead.',
    fix: (match) => {
      return match.replace(/@\/services\//g, '@/application/services/');
    }
  },

  // Règle 2: Pas d'imports types legacy
  LEGACY_TYPES: {
    id: 'R002',
    name: 'No legacy type imports',
    severity: 'ERROR',
    pattern: /import\s+{?\s*([^}]+?)\s*}?\s+from\s+['"]@\/types\/([^'"]+)['"]/g,
    message: '❌ Import from legacy @/types/ detected. Use @/dtos/ instead.',
    fix: (match) => {
      return match.replace(/@\/types\//g, '@/dtos/entities/');
    }
  },

  // Règle 3: Pas d'appels supabase direct (hors adapters)
  DIRECT_SUPABASE: {
    id: 'R003',
    name: 'No direct supabase calls',
    severity: 'ERROR',
    pattern: /supabase\.from\(['"]([^'"]+)['"]\)\.(select|insert|update|delete)/g,
    message: '❌ Direct supabase.from() call detected. Use repository pattern via adapters.',
    fix: null,
    exclude: ['src/infrastructure/supabase/adapters/', 'src/integrations/supabase/']
  },

  // Règle 4: Pas de snake_case dans les identifiants TS (hors strings)
  SNAKE_CASE_IDENTIFIER: {
    id: 'R004',
    name: 'No snake_case identifiers',
    severity: 'WARNING',
    pattern: /\b([a-z]+_[a-z]+(?:_[a-z]+)*)\b/g,
    message: '⚠️  Snake_case identifier detected. Use camelCase instead.',
    fix: (match) => {
      return match.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    },
    exclude: ['"', "'", '//', '/*', '*/', '`']
  },

  // Règle 5: Pas de 'any' types
  ANY_TYPE: {
    id: 'R005',
    name: 'No any types',
    severity: 'ERROR',
    pattern: /:\s*any\b/g,
    message: '❌ "any" type detected. Use specific DTO or domain types.',
    fix: null,
    exclude: ['node_modules/', 'dist/', 'build/']
  },

  // Règle 6: Pas de hooks non-hexagonaux (useXxx sans Hex)
  NON_HEX_HOOK: {
    id: 'R006',
    name: 'Use hexagonal hooks',
    severity: 'WARNING',
    pattern: /export\s+function\s+use(\w+)\(/g,
    message: '⚠️  Hook "use$1" might not be hexagonal. Consider using use$1Hex pattern.',
    fix: (match, name) => {
      if (!name.endsWith('Hex')) {
        return match.replace(/use(\w+)\(/, (_, name) => `use${name}Hex()`);
      }
      return match;
    },
    exclude: ['useProjectsHex', 'useProjectWorkflowHex', 'useProjectEditHex', 'usePhasesHex']
  },

  // Règle 7: Pas de DTOs snake_case
  DTO_SNAKE_CASE: {
    id: 'R007',
    name: 'DTOs must use camelCase',
    severity: 'ERROR',
    pattern: /interface\s+\w+DTO\s*{([^}]*?)(\w+_\w+)/g,
    message: '❌ Snake_case field in DTO. Use camelCase instead.',
    fix: (match, before, field) => {
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      return match.replace(field, camelField);
    }
  },

  // Règle 8: Pas de DB calls dans les composants UI
  DB_IN_COMPONENT: {
    id: 'R008',
    name: 'No DB calls in UI components',
    severity: 'ERROR',
    pattern: /(?:await\s+)?(?:supabase|db|database)\.\w+\(/g,
    message: '❌ Database call detected in component. Move to service layer.',
    exclude: ['src/hooks/', 'src/application/', 'src/infrastructure/', 'src/dtos/', 'src/domain/']
  },

  // Règle 9: Pas de références aux services legacy
  LEGACY_SERVICE_REF: {
    id: 'R009',
    name: 'No legacy service references',
    severity: 'ERROR',
    pattern: /new\s+(\w+Service)\(/g,
    message: '❌ Legacy service instantiation detected. Use dependency injection.',
    exclude: ['src/application/', 'src/infrastructure/']
  },

  // Règle 10: Validation des transformers
  TRANSFORMER_COMPLETENESS: {
    id: 'R010',
    name: 'Transformer must implement all methods',
    severity: 'WARNING',
    pattern: /class\s+(\w+)Transformer\s*{([^}]*)}/gs,
    message: '⚠️  Transformer missing required methods (fromSupabase, toSupabase, toDTO, fromDTO)',
    check: (content) => {
      const methods = ['fromSupabase', 'toSupabase', 'toDTO', 'fromDTO'];
      const missing = methods.filter(m => !content.includes(m));
      return missing.length > 0 ? `Missing: ${missing.join(', ')}` : null;
    }
  }
};

// ============================================
// 2. UTILITAIRES
// ============================================

const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  BOLD: '\x1b[1m'
};

class ViolationDetector {
  constructor(options = {}) {
    this.options = {
      fix: options.fix || false,
      json: options.json || false,
      verbose: options.verbose || false,
      ...options
    };
    this.violations = [];
    this.stats = {
      totalFiles: 0,
      totalViolations: 0,
      fixed: 0,
      errors: 0,
      warnings: 0
    };
  }

  // Vérifier si un fichier doit être exclu
  shouldExclude(filePath, rule) {
    if (!rule.exclude) return false;
    return rule.exclude.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  // Lire un fichier
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err.message);
      return null;
    }
  }

  // Écrire un fichier
  writeFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err.message);
      return false;
    }
  }

  // Détecter les violations dans un fichier
  detectViolations(filePath, content) {
    const fileViolations = [];
    
    for (const [key, rule] of Object.entries(RULES)) {
      // Vérifier l'exclusion
      if (this.shouldExclude(filePath, rule)) continue;

      // Réinitialiser le pattern
      rule.pattern.lastIndex = 0;
      let match;

      // Cas spécial: Transformer completeness
      if (rule.check) {
        const result = rule.check(content);
        if (result) {
          fileViolations.push({
            rule: key,
            ...rule,
            line: 1,
            column: 1,
            match: null,
            message: `${rule.message}: ${result}`
          });
        }
        continue;
      }

      // Pattern standard
      while ((match = rule.pattern.exec(content)) !== null) {
        // Vérifier si le match est dans une chaîne ou commentaire
        if (this.isInStringOrComment(content, match.index)) continue;

        // Exclure les identifiants déjà en camelCase
        if (key === 'SNAKE_CASE_IDENTIFIER') {
          const before = content.substring(Math.max(0, match.index - 20), match.index);
          if (before.includes('//') || before.includes('*')) continue;
        }

        const violation = {
          rule: key,
          ...rule,
          line: this.getLineNumber(content, match.index),
          column: this.getColumnNumber(content, match.index),
          match: match[0],
          groups: match.slice(1),
          raw: match,
          message: rule.message,
          fixable: !!rule.fix
        };

        // Message avec remplacement des variables
        if (rule.message.includes('$1') && match[1]) {
          violation.message = rule.message.replace(/\$(\d+)/g, (_, num) => match[num] || '');
        }

        fileViolations.push(violation);
      }
    }

    return fileViolations;
  }

  // Vérifier si la position est dans une chaîne ou commentaire
  isInStringOrComment(content, position) {
    const before = content.substring(0, position);
    const lines = before.split('\n');
    const lastLine = lines[lines.length - 1];
    
    // Vérifier les commentaires
    if (lastLine.includes('//')) return true;
    
    // Vérifier les chaînes (simplifié)
    const quotes = (before.match(/['"`]/g) || []).length;
    return quotes % 2 !== 0;
  }

  // Obtenir le numéro de ligne
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length;
  }

  // Obtenir le numéro de colonne
  getColumnNumber(content, position) {
    const before = content.substring(0, position);
    const lastLine = before.split('\n').pop() || '';
    return lastLine.length + 1;
  }

  // Appliquer un fix
  applyFix(filePath, content, violation) {
    if (!violation.fixable || !violation.match) return content;
    
    try {
      if (typeof violation.fix === 'function') {
        return content.replace(violation.match, violation.fix(violation.match, ...violation.groups));
      } else if (typeof violation.fix === 'string') {
        return content.replace(violation.match, violation.fix);
      }
    } catch (err) {
      console.error(`Fix failed for ${filePath}:`, err.message);
    }
    return content;
  }

  // Traiter un fichier
  processFile(filePath) {
    this.stats.totalFiles++;
    const content = this.readFile(filePath);
    if (!content) return;

    const violations = this.detectViolations(filePath, content);
    
    if (violations.length > 0) {
      this.violations.push({
        file: filePath,
        violations
      });
      this.stats.totalViolations += violations.length;
      
      // Compter par sévérité
      violations.forEach(v => {
        if (v.severity === 'ERROR') this.stats.errors++;
        else if (v.severity === 'WARNING') this.stats.warnings++;
      });

      // Appliquer les fixes
      if (this.options.fix) {
        let fixedContent = content;
        let fixedCount = 0;
        
        for (const violation of violations) {
          if (violation.fixable) {
            const newContent = this.applyFix(filePath, fixedContent, violation);
            if (newContent !== fixedContent) {
              fixedContent = newContent;
              fixedCount++;
            }
          }
        }
        
        if (fixedCount > 0) {
          this.writeFile(filePath, fixedContent);
          this.stats.fixed += fixedCount;
        }
      }
    }
  }

  // Parcourir un répertoire
  walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorer certains dossiers
        if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(file)) {
          this.walkDir(filePath);
        }
      } else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
        this.processFile(filePath);
      }
    }
  }

  // Afficher les résultats
  printResults() {
    if (this.options.json) {
      console.log(JSON.stringify({
        stats: this.stats,
        violations: this.violations
      }, null, 2));
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`${COLORS.BOLD}🔍 HEXAGONAL ARCHITECTURE VIOLATION REPORT${COLORS.RESET}`);
    console.log('='.repeat(80) + '\n');

    if (this.violations.length === 0) {
      console.log(`${COLORS.GREEN}✅ No violations found!${COLORS.RESET}`);
      return;
    }

    // Grouper par fichier
    for (const { file, violations } of this.violations) {
      console.log(`${COLORS.CYAN}📄 ${file}${COLORS.RESET}`);
      
      for (const v of violations) {
        const color = v.severity === 'ERROR' ? COLORS.RED : COLORS.YELLOW;
        const severity = v.severity === 'ERROR' ? '❌ ERROR' : '⚠️  WARNING';
        console.log(`  ${color}${severity}${COLORS.RESET} [${v.id}] ${v.message}`);
        console.log(`    ${COLORS.MAGENTA}→${COLORS.RESET} Line ${v.line}, Col ${v.column}`);
        if (v.match) {
          console.log(`    ${COLORS.BLUE}Match:${COLORS.RESET} "${v.match}"`);
        }
        if (v.fixable) {
          console.log(`    ${COLORS.GREEN}💡 Auto-fixable${COLORS.RESET}`);
        }
      }
      console.log('');
    }

    // Stats
    console.log('='.repeat(80));
    console.log(`${COLORS.BOLD}📊 STATISTICS${COLORS.RESET}`);
    console.log(`  Total files scanned: ${this.stats.totalFiles}`);
    console.log(`  Total violations: ${this.stats.totalViolations}`);
    console.log(`  ${COLORS.RED}Errors: ${this.stats.errors}${COLORS.RESET}`);
    console.log(`  ${COLORS.YELLOW}Warnings: ${this.stats.warnings}${COLORS.RESET}`);
    
    if (this.options.fix) {
      console.log(`  ${COLORS.GREEN}✅ Fixed: ${this.stats.fixed} violations${COLORS.RESET}`);
    }
    console.log('='.repeat(80) + '\n');

    // Résumé par règle
    console.log(`${COLORS.BOLD}📋 RULE SUMMARY${COLORS.RESET}`);
    const ruleStats = {};
    for (const { violations } of this.violations) {
      for (const v of violations) {
        ruleStats[v.id] = (ruleStats[v.id] || 0) + 1;
      }
    }
    for (const [id, count] of Object.entries(ruleStats)) {
      console.log(`  ${id}: ${count} violations`);
    }
    console.log('');

    // Exit code
    if (this.stats.errors > 0) {
      process.exit(1);
    }
  }

  // Méthode principale
  run(dirs = ['src']) {
    console.log(`${COLORS.BOLD}🔍 Scanning for hexagonal violations...${COLORS.RESET}\n`);
    
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        this.walkDir(dir);
      }
    }
    
    this.printResults();
  }
}

// ============================================
// 3. CLI
// ============================================

function showHelp() {
  console.log(`
${COLORS.BOLD}🔍 HEXAGONAL VIOLATION DETECTOR${COLORS.RESET}

Usage: node scripts/check-hexagonal-violations.js [options] [dirs]

Options:
  --fix      Try to auto-fix violations (experimental)
  --json     Output results in JSON format
  --verbose  Show detailed logs
  --help     Show this help message

Default directories:
  src/

Examples:
  # Check all files in src/
  node scripts/check-hexagonal-violations.js

  # Check specific directories
  node scripts/check-hexagonal-violations.js src/components src/hooks

  # Auto-fix violations
  node scripts/check-hexagonal-violations.js --fix

  # JSON output for CI/CD
  node scripts/check-hexagonal-violations.js --json

Rules:
  ${Object.values(RULES).map(r => 
    `${r.id} [${r.severity}] ${r.name}`
  ).join('\n  ')}
  `);
}

// ============================================
// 4. EXÉCUTION
// ============================================

// Vérifier si c'est le module principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  // Parser les arguments
  const options = {
    fix: false,
    json: false,
    verbose: false
  };
  const dirs = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--fix') options.fix = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--help') { showHelp(); process.exit(0); }
    else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    } else {
      dirs.push(arg);
    }
  }

  // Lancer le détecteur
  const detector = new ViolationDetector(options);
  detector.run(dirs.length > 0 ? dirs : ['src']);
}

// ============================================
// 5. EXPORT POUR UTILISATION PROGRAMMATIQUE
// ============================================

export {
  RULES, ViolationDetector
};
