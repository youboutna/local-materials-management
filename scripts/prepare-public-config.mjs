import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { configScript } from './lib/public-config.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output || !output.endsWith('/config.js') || resolve(input) === resolve(output)) {
  console.error('Usage: node scripts/prepare-public-config.mjs /etc/hadratech/public.json /etc/hadratech/config.js');
  process.exit(1);
}
try {
  const source = JSON.parse(readFileSync(input, 'utf8'));
  writeFileSync(output, configScript(source), { mode: 0o644 });
  console.log('Public configuration validated and written. No environment file changed.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid public configuration');
  process.exit(1);
}