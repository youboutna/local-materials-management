/**
 * envelopeDetection — extraction de l'« enveloppe » documentaire d'un DQE
 * (émetteur, destinataire, référence, date, projet, validité, devise, normes
 * Factur-X / EN 16931) et neutralisation de ces lignes côté parseur de lignes.
 *
 * Bug corrigé : les blocs d'en-tête / pied (raison sociale, adresse, téléphone,
 * e-mail, « Contexte », « Factur-X … TypeCode 310 », « Page 1/2 »…) étaient
 * interprétés comme des LIGNES DQE. Ils sont désormais lus comme des
 * MÉTADONNÉES de contexte et exclus des lignes.
 *
 * Pur TypeScript — aucune dépendance React / Supabase.
 */

export interface EnvelopeParty {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface DqeEnvelope {
  documentNumber?: string;
  documentDate?: string;
  documentType?: string;
  projectCode?: string;
  emitter: EnvelopeParty;
  receiver: EnvelopeParty;
  validityDays?: number;
  validityEndDate?: string;
  currency?: string;
  standard?: string;
  facturXType?: string;
  tenderReference?: string;
  signatory?: string;
  signatureStatus?: 'PENDING' | 'SIGNED';
  traceabilityRef?: string;
}

const EMAIL_RX = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const PHONE_RX = /\+?\d[\d\s().\-]{6,}\d/;
const DATE_RX = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/;
const DOC_REF_RX = /\b((?:DQE|DEV|FAC|EDB|BC)[-\s]?[A-Z0-9-]{4,})/i;

/** Étiquettes « clé : valeur » de l'enveloppe. */
const LABELS: { key: keyof DqeEnvelope | 'emitterName' | 'receiverName'; rx: RegExp }[] = [
  { key: 'documentNumber', rx: /^n[°o]?\s*(?:dqe|document|devis|facture)?\s*[:\-]?\s*/i },
  { key: 'documentDate', rx: /^date\s*(?:d.?[eé]mission)?\s*[:\-]\s*/i },
  { key: 'projectCode', rx: /^projet\s*[:\-]?\s*/i },
  { key: 'tenderReference', rx: /^appel\s+d.?offres?\s*[:\-]?\s*/i },
  { key: 'validityDays', rx: /^validit[eé]\s*[:\-]?\s*/i },
  { key: 'emitterName', rx: /^([eé]metteur|exp[eé]diteur|fournisseur)\s*[:\-]?\s*/i },
  { key: 'receiverName', rx: /^(destinataire|client|ma[iî]tre\s+d.?ouvrage)\s*[:\-]?\s*/i },
  { key: 'currency', rx: /^devise\s*[:\-]?\s*/i },
  { key: 'signatory', rx: /^signataire\s*[:\-]?\s*/i },
  { key: 'traceabilityRef', rx: /^r[eé]f[eé]rence\s+de\s+tra[cç]abilit[eé]\s*[:\-]?\s*/i },
];

/**
 * Motifs de bruit documentaire : ces lignes ne sont jamais des lignes DQE.
 * Volontairement conservateur : aucune ligne portant une quantité ou un
 * montant n'est neutralisée (voir `isEnvelopeRow`).
 */
const NOISE_RX: RegExp[] = [
  /^(dqe|devis|facture|expression\s+de\s+besoins?)$/i,
  /^contexte$/i,
  /^conditions?\s+g[eé]n[eé]rales?/i,
  /^validation$/i,
  /^signature\s+requise/i,
  /^en\s+attente\s+de\s+signature/i,
  /^factur-?x/i,
  /^en\s?16931/i,
  /^typecode\b/i,
  /^page\s*\d+\s*\/\s*\d+/i,
  /^[\s\-—–_.·]+$/,
];

const CONTACT_ONLY_RX = new RegExp(`^(?:${PHONE_RX.source}|${EMAIL_RX.source})([\\s·|,;/]*(?:${PHONE_RX.source}|${EMAIL_RX.source}))*$`);

const clean = (v: string) => v.replace(/\s+/g, ' ').trim().replace(/^[:·|–—-]\s*/, '');

function stripLabel(text: string, rx: RegExp): string {
  return clean(text.replace(rx, ''));
}

/** Une cellule ne contenant qu'un contact (téléphone / e-mail) ou du bruit. */
export function isEnvelopeNoise(text: string): boolean {
  const v = clean(text);
  if (!v) return true;
  if (NOISE_RX.some((rx) => rx.test(v))) return true;
  if (CONTACT_ONLY_RX.test(v)) return true;
  if (LABELS.some(({ rx }) => rx.test(v) && stripLabel(v, rx).length <= 80)) return true;
  return false;
}

const hasValue = (cells: string[]): boolean =>
  cells.slice(1).some((c) => /\d/.test(String(c ?? '')) && /[\d\s.,]{3,}/.test(String(c ?? '')));

/**
 * Une ligne est « enveloppe » si sa première cellule signifiante est du bruit
 * documentaire et qu'aucune valeur chiffrée exploitable n'est présente.
 */
export function isEnvelopeRow(cells: string[]): boolean {
  const texts = (cells ?? []).map((c) => clean(String(c ?? ''))).filter(Boolean);
  if (!texts.length) return true;
  if (hasValue(texts)) return false;
  return texts.every((t) => isEnvelopeNoise(t));
}

/**
 * Balaye la matrice texte d'un document et renvoie l'enveloppe détectée ainsi
 * que les index de lignes consommées (à exclure des lignes DQE).
 */
export function extractEnvelope(rows: string[][]): { envelope: DqeEnvelope; consumedRows: number[] } {
  const envelope: DqeEnvelope = { emitter: {}, receiver: {} };
  const consumedRows: number[] = [];
  let pending: 'emitter' | 'receiver' | null = null;

  const setParty = (side: 'emitter' | 'receiver', value: string) => {
    const party = envelope[side];
    if (!value) return;
    if (EMAIL_RX.test(value) && !party.email) party.email = value.match(EMAIL_RX)![0];
    else if (PHONE_RX.test(value) && !party.phone) party.phone = value.match(PHONE_RX)![0].trim();
    else if (!party.name) party.name = value;
    else if (/nouakchott|carrefour|avenue|rue|bp\b|quartier|ilot/i.test(value) && !party.address) party.address = value;
    else party.name = `${party.name} ${value}`.trim();
  };

  rows.forEach((row, index) => {
    const cells = (row ?? []).map((c) => clean(String(c ?? '')));
    const texts = cells.filter(Boolean);
    if (!texts.length) return;
    let consumed = false;

    for (const text of texts) {
      const label = LABELS.find(({ rx }) => rx.test(text));
      if (label) {
        const value = stripLabel(text, label.rx);
        const inlineOrNext = value || texts[texts.indexOf(text) + 1] || '';
        consumed = true;
        switch (label.key) {
          case 'emitterName':
            if (inlineOrNext) setParty('emitter', inlineOrNext);
            pending = inlineOrNext ? null : 'emitter';
            break;
          case 'receiverName':
            if (inlineOrNext) setParty('receiver', inlineOrNext);
            pending = inlineOrNext ? null : 'receiver';
            break;
          case 'documentNumber': {
            const ref = inlineOrNext.match(DOC_REF_RX)?.[1] ?? text.match(DOC_REF_RX)?.[1];
            if (ref && !envelope.documentNumber) envelope.documentNumber = ref.replace(/\s/g, '');
            break;
          }
          case 'documentDate':
            envelope.documentDate ??= inlineOrNext.match(DATE_RX)?.[1];
            break;
          case 'projectCode':
            if (inlineOrNext && inlineOrNext !== '—') envelope.projectCode ??= inlineOrNext;
            break;
          case 'tenderReference':
            if (inlineOrNext && inlineOrNext !== '—') envelope.tenderReference ??= inlineOrNext;
            break;
          case 'validityDays': {
            const days = inlineOrNext.match(/(\d+)\s*(?:j|jours?)/i)?.[1];
            if (days) envelope.validityDays ??= Number(days);
            envelope.validityEndDate ??= inlineOrNext.match(DATE_RX)?.[1];
            break;
          }
          case 'currency': {
            const cur = inlineOrNext.match(/\b(MRU|MRO|EUR|USD|XOF|MAD)\b/i)?.[1];
            if (cur) envelope.currency ??= cur.toUpperCase();
            break;
          }
          case 'signatory':
            if (inlineOrNext) envelope.signatory ??= inlineOrNext;
            break;
          case 'traceabilityRef':
            if (inlineOrNext) envelope.traceabilityRef ??= inlineOrNext;
            break;
          default:
            break;
        }
        continue;
      }

      if (/factur-?x|en\s?16931/i.test(text)) {
        envelope.standard ??= 'EN 16931';
        const type = text.match(/typecode\s*(\d{3})/i)?.[1];
        if (type) envelope.facturXType ??= `TypeCode ${type}`;
        const ref = text.match(DOC_REF_RX)?.[1];
        if (ref) envelope.documentNumber ??= ref.replace(/\s/g, '');
        consumed = true;
        continue;
      }
      if (/^en\s+attente\s+de\s+signature/i.test(text)) {
        envelope.signatureStatus ??= 'PENDING';
        consumed = true;
        continue;
      }
      if (pending) {
        // Continuation multi-lignes d'un bloc Émetteur / Destinataire.
        if (isEnvelopeNoise(text) || !hasValue(texts)) {
          setParty(pending, text);
          consumed = true;
          continue;
        }
      }
      if (isEnvelopeNoise(text) && !hasValue(texts)) {
        if (EMAIL_RX.test(text)) envelope.emitter.email ??= text.match(EMAIL_RX)![0];
        if (PHONE_RX.test(text)) envelope.emitter.phone ??= text.match(PHONE_RX)![0].trim();
        if (/^dqe$|^devis$|^facture$/i.test(text)) envelope.documentType ??= text.toUpperCase();
        consumed = true;
      }
    }

    if (isEnvelopeRow(cells)) consumed = true;
    if (consumed) consumedRows.push(index);
    if (hasValue(texts)) pending = null;
  });

  if (!envelope.documentNumber) {
    for (const row of rows.slice(0, 15)) {
      const hit = (row ?? []).map((c) => String(c ?? '')).join(' ').match(DOC_REF_RX)?.[1];
      if (hit) { envelope.documentNumber = hit.replace(/\s/g, ''); break; }
    }
  }
  return { envelope, consumedRows };
}

/** Résumé lisible pour les avertissements du parseur. */
export function summarizeEnvelope(env: DqeEnvelope): string[] {
  const bits: string[] = [];
  if (env.documentNumber) bits.push(`Réf. ${env.documentNumber}`);
  if (env.documentDate) bits.push(env.documentDate);
  if (env.emitter.name) bits.push(`Émetteur : ${env.emitter.name}`);
  if (env.receiver.name) bits.push(`Destinataire : ${env.receiver.name}`);
  if (env.standard) bits.push(env.facturXType ? `${env.standard} · ${env.facturXType}` : env.standard);
  return bits.length ? [`Enveloppe documentaire détectée (contexte, hors lignes) — ${bits.join(' · ')}.`] : [];
}
