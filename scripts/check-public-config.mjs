import { readFileSync } from 'node:fs';
import { parseConfigScript } from './lib/public-config.mjs';
try {
  parseConfigScript(readFileSync(process.argv[2], 'utf8'));
  console.log('Public runtime configuration is valid.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid public configuration');
  process.exit(1);
}