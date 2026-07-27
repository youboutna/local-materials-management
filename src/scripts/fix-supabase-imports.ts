/**
 * Script to fix all supabase imports and calls in hooks
 * Replaces direct supabase usage with RepositoryFactory pattern
 */

import * as fs from 'fs';
import * as path from 'path';

const hooksDir = path.join(__dirname, '../hooks/hexagonal');

interface FileFix {
  filePath: string;
  originalContent: string;
  fixedContent: string;
  changes: string[];
}

// Files that need fixing based on grep results
const filesToFix = [
  'useProjectMaterialsHex.ts',
  'useEnhancedInspectionCrudHex.ts',
  'useQuantityTakeoffHex.ts',
  'useMonitoringHex.ts',
  'useEmployeeManagementHex.ts',
  'usePhasePaymentsHex.ts',
  'usePhaseMonitoringSummaryHex.ts',
  'useTenderCrudHex.ts',
  'usePhaseInspectionsHex.ts',
  'useManagementActionsHex.ts',
  'useInspectionMonitoringHex.ts',
  'useStorageHex.ts',
  'usePaymentCrudHex.ts',
  'usePaymentActionsHex.ts',
  'useSupplierSubmissionsHex.ts',
  'useInspectionsCrudHex.ts',
  'useSupplierDashboardHex.ts',
  'useUserManagementHex.ts',
  'useUsersAdminHex.ts',
  'useTenderDocumentsHex.ts',
  'useMonitoringStatsHex.ts',
  'useSuppliersManagementHex.ts',
  'useActiveSuppliersHex.ts',
  'useSupplierPortalCompleteHex.ts'
];

function fixFile(filePath: string): FileFix {
  const fullPath = path.join(hooksDir, filePath);
  const originalContent = fs.readFileSync(fullPath, 'utf-8');
  let fixedContent = originalContent;
  const changes: string[] = [];

  // 1. Replace supabase import with RepositoryFactory
  if (fixedContent.includes("import { supabase }")) {
    fixedContent = fixedContent.replace(
      /import { supabase } from ['"]@\/integrations\/supabase\/client['"];?/,
      "import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';"
    );
    changes.push('Replaced supabase import with RepositoryFactory');
  }

  // 2. Replace supabase calls with RepositoryFactory patterns
  const supabaseCallPatterns = [
    {
      pattern: /await supabase\.from\(['"]([^'"]+)['"]\)\.select\(([^)]+)\)(?:\.eq\(['"]([^'"]+)['"],([^)]+)\))?(?:\.order\(([^)]+)\))?/g,
      replacement: (match: string, table: string, select: string, eqField?: string, eqValue?: string, order?: string) => {
        let repoCall = `const repository = RepositoryFactory.get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}Repository();\n      const result = await repository.findAll({`;
        
        if (eqField && eqValue) {
          repoCall += `${eqField}: ${eqValue}`;
        }
        
        repoCall += '});';
        
        return repoCall;
      }
    },
    {
      pattern: /await supabase\.from\(['"]([^'"]+)['"]\)\.insert\(([^)]+)\)\.select\(\)/g,
      replacement: (match: string, table: string, data: string) => {
        return `const repository = RepositoryFactory.get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}Repository();\n      const result = await repository.create(${data});`;
      }
    },
    {
      pattern: /await supabase\.from\(['"]([^'"]+)['"]\)\.update\(([^)]+)\)\.eq\(['"]([^'"]+)['"],([^)]+)\)\.select\(\)/g,
      replacement: (match: string, table: string, data: string, idField: string, idValue: string) => {
        return `const repository = RepositoryFactory.get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}Repository();\n      const result = await repository.update(${idValue}, ${data});`;
      }
    },
    {
      pattern: /await supabase\.from\(['"]([^'"]+)['"]\)\.delete\(\)\.eq\(['"]([^'"]+)['"],([^)]+)\)/g,
      replacement: (match: string, table: string, idField: string, idValue: string) => {
        return `const repository = RepositoryFactory.get${table.charAt(0).toUpperCase() + table.slice(1).replace(/s$/, '')}Repository();\n      await repository.delete(${idValue});`;
      }
    }
  ];

  // Apply all patterns
  supabaseCallPatterns.forEach(({ pattern, replacement }) => {
    const matches = fixedContent.match(pattern);
    if (matches) {
      fixedContent = fixedContent.replace(pattern, replacement);
      changes.push(`Replaced ${matches.length} supabase calls`);
    }
  });

  // 3. Fix common data destructuring patterns
  if (fixedContent.includes('const { data, error }')) {
    fixedContent = fixedContent.replace(
      /const { data, error } = await ([^;]+);/,
      'const result = await $1;\n      const data = result;\n      const error = null;'
    );
    changes.push('Fixed data destructuring');
  }

  return {
    filePath,
    originalContent,
    fixedContent,
    changes
  };
}

function main() {
  console.log('🔧 Fixing supabase imports and calls in hooks...\n');

  const results: FileFix[] = [];

  filesToFix.forEach(fileName => {
    try {
      const filePath = path.join(hooksDir, fileName);
      
      if (fs.existsSync(filePath)) {
        const fix = fixFile(fileName);
        
        if (fix.changes.length > 0) {
          // Write the fixed content
          fs.writeFileSync(filePath, fix.fixedContent);
          results.push(fix);
          
          console.log(`✅ Fixed ${fileName}:`);
          fix.changes.forEach(change => console.log(`   - ${change}`));
        } else {
          console.log(`⏭️  Skipped ${fileName} (no changes needed)`);
        }
      } else {
        console.log(`❌ File not found: ${fileName}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${fileName}:`, error);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`- Total files processed: ${filesToFix.length}`);
  console.log(`- Files fixed: ${results.length}`);
  console.log(`- Total changes: ${results.reduce((sum, fix) => sum + fix.changes.length, 0)}`);

  if (results.length > 0) {
    console.log(`\n🎉 Successfully fixed ${results.length} files!`);
  } else {
    console.log(`\n⚠️  No files needed fixing.`);
  }
}

// Run the script
main();
