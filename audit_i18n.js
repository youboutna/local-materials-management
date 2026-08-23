import fs from 'fs';
import path from 'path';

const folders = [
  'src/components/admin',
  'src/components/alerts',
  'src/components/analytics',
  'src/components/auth',
  'src/components/boq',
  'src/components/common',
  'src/components/dashboard',
  'src/components/documents',
  'src/components/employees',
  'src/components/gis',
  'src/components/guarantees',
  'src/components/inspections'
];

const results = {};

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.tsx')) {
      scanFile(fullPath);
    }
  });
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const hardcoded = [];

  lines.forEach((line, index) => {
    if (line.trim().startsWith('import') || line.trim().startsWith('export type')) {
        return;
    }

    // JSX Text
    const jsxMatch = line.match(/>([^<{}\n\r]+)</g);
    if (jsxMatch) {
      jsxMatch.forEach(m => {
        const text = m.slice(1, -1).trim();
        if (text.length > 1 && /[a-zA-ZÀ-ÿ]/.test(text) && !/^[0-9\W]+$/.test(text) && !text.includes('className') && !text.includes('t(')) {
           hardcoded.push({ line: index + 1, text, type: 'JSX Text' });
        }
      });
    }

    // Props
    const propMatch = line.match(/(?:label|placeholder|title|description|message)=["']([^"']+)["']/g);
    if (propMatch) {
      propMatch.forEach(m => {
        const text = m.split('=')[1].slice(1, -1).trim();
        if (text.length > 1 && !text.includes('.') && !text.includes('/') && !text.includes('t(')) {
           hardcoded.push({ line: index + 1, text, type: 'Prop' });
        }
      });
    }

    // Toast/Console/Error messages
    const msgMatch = line.match(/(?:toast|console\.error|throw new Error|description:)\s*\(\s*["']([^"']+)["']/g);
    if (msgMatch) {
        msgMatch.forEach(m => {
            const parts = m.split(/["']/);
            const text = parts[1];
            if (text && text.length > 1 && !text.startsWith('http') && !text.includes('${') && !text.includes('t(')) {
                hardcoded.push({ line: index + 1, text, type: 'Message' });
            }
        });
    }
    
    // String properties in objects that look like UI labels (Capitalized or French)
    const objPropMatch = line.match(/:\s*["']([A-ZÀ-ÿ][^"']+)["']/g);
    if (objPropMatch) {
        objPropMatch.forEach(m => {
            const text = m.split(/:\s*/)[1].slice(1, -1).trim();
            if (text.length > 1 && !text.includes('.') && !text.includes('t(') && !text.includes(' ') === false) { // at least one space usually means it's a sentence/label
                 hardcoded.push({ line: index + 1, text, type: 'Object Prop' });
            }
        });
    }
  });

  if (hardcoded.length > 0) {
    results[filePath] = hardcoded;
  }
}

folders.forEach(folder => scanDir(folder));

process.stdout.write(JSON.stringify(results, null, 2));
