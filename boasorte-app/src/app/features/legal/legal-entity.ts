/**
 * Who is responsible for BoaSorte (LGPD "controlador") — single source for the terms and the privacy policy.
 *
 * ⚠️ Values in [BRACKETS] are pending. `npm run check:legal` fails while any remain, and the deploy checklist
 * (deploy/README.md) requires it to pass before publishing.
 */
export const LEGAL_ENTITY = {
  name: '[RAZÃO SOCIAL]',
  cnpj: '[CNPJ]',
  email: 'contato@boasorte.app',
  hostingCountry: 'Brasil',
  /** ISO date the current texts took effect. */
  effectiveDate: '2026-10-12',
} as const;

export const EFFECTIVE_DATE_LABEL = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(
  new Date(`${LEGAL_ENTITY.effectiveDate}T00:00:00Z`),
);
