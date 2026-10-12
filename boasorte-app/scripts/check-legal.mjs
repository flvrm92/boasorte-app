// Fails while the legal entity data (terms + privacy policy) still has [PENDING] placeholders.
// Required by the deploy checklist (deploy/README.md) before publishing.
import { readFileSync } from 'node:fs';

const file = new URL('../src/app/features/legal/legal-entity.ts', import.meta.url);
const pending = [...readFileSync(file, 'utf8').matchAll(/(\w+):\s*'\[([^\]]+)\]'/g)].map(m => `${m[1]} (${m[2]})`);

if (pending.length) {
  console.error(`Dados legais pendentes em src/app/features/legal/legal-entity.ts: ${pending.join(', ')}`);
  process.exit(1);
}
console.log('Dados legais completos.');
