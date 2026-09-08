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

type EnvelopeField = (typeof LABELS)[number]['key'];

/** Une ligne réellement tabulaire (au moins deux cellules dont une chiffrée). */
function isValuedRow(texts: string[]): boolean {
  return texts.length >= 2 && hasValue(texts);
}

/**
 * Balaye la matrice texte d'un document et renvoie l'enveloppe détectée ainsi
 * que les index de lignes consommées (à exclure des lignes DQE).
 *
 * Gère les mises en page où l'étiquette et sa valeur sont sur DEUX lignes
 * (« Projet : » puis « PPGASDL ASSABA LOT 1 ») ainsi que le bloc d'en-tête
 * initial (raison sociale, adresse, contacts) sans étiquette.
 */
export function extractEnvelope(rows: string[][]): { envelope: DqeEnvelope; consumedRows: number[] } {
  const envelope: DqeEnvelope = { emitter: {}, receiver: {} };
  const consumed = new Set<number>();
  const matrix = rows.map((row) => (row ?? []).map((c) => clean(String(c ?? ''))).filter(Boolean));
  const firstValuedRow = matrix.findIndex(isValuedRow);
  const headerLimit = firstValuedRow < 0 ? matrix.length : firstValuedRow;

  const setParty = (side: 'emitter' | 'receiver', value: string): boolean => {
    const party = envelope[side];
    if (!value || value === '—') return false;
    const email = value.match(EMAIL_RX)?.[0];
    const phone = value.match(PHONE_RX)?.[0]?.trim();
    if (email) party.email ??= email;
    if (phone && !email) party.phone ??= phone;
    if (email || phone) return true;
    if (/nouakchott|mauritanie|carrefour|avenue|rue\b|bp\b|quartier|ilot/i.test(value)) {
      party.address = party.address ? `${party.address}, ${value}` : value;
      return true;
    }
    party.name = party.name ? `${party.name} ${value}`.trim() : value;
    return true;
  };

  /** Affecte une valeur au champ d'enveloppe ; false si la valeur est vide/inutilisable. */
  const assign = (field: EnvelopeField, value: string): boolean => {
    const v = clean(value);
    if (!v || v === '—') return false;
    switch (field) {
      case 'emitterName': return setParty('emitter', v);
      case 'receiverName': return setParty('receiver', v);
      case 'documentNumber': {
        const ref = v.match(DOC_REF_RX)?.[1];
        if (!ref) return false;
        envelope.documentNumber ??= ref.replace(/\s/g, '');
        return true;
      }
      case 'documentDate': {
        const d = v.match(DATE_RX)?.[1];
        if (!d) return false;
        envelope.documentDate ??= d;
        return true;
      }
      case 'projectCode': envelope.projectCode ??= v; return true;
      case 'tenderReference': envelope.tenderReference ??= v; return true;
      case 'validityDays': {
        const days = v.match(/(\d+)\s*(?:j\b|jours?)/i)?.[1];
        const end = v.match(DATE_RX)?.[1];
        if (!days && !end) return false;
        if (days) envelope.validityDays ??= Number(days);
        if (end) envelope.validityEndDate ??= end;
        return true;
      }
      case 'currency': {
        const cur = v.match(/\b(MRU|MRO|EUR|USD|XOF|MAD)\b/i)?.[1];
        if (!cur) return false;
        envelope.currency ??= cur.toUpperCase();
        return true;
      }
      case 'signatory': envelope.signatory ??= v; return true;
      case 'traceabilityRef': envelope.traceabilityRef ??= v; return true;
      default: return false;
    }
  };

  let pending: EnvelopeField | null = null;

  matrix.forEach((texts, index) => {
    if (!texts.length) { consumed.add(index); return; }
    if (isValuedRow(texts)) {
      // Ligne tabulaire : fin de tout bloc d'enveloppe en cours.
      pending = null;
      if (texts.every((t) => isEnvelopeNoise(t))) consumed.add(index);
      return;
    }

    let rowConsumed = false;
    texts.forEach((text, ti) => {
      // 1) Normes Factur-X / EN 16931 (souvent en pied de page).
      if (/factur-?x|en\s?16931|typecode/i.test(text)) {
        envelope.standard ??= 'EN 16931';
        const type = text.match(/typecode\s*(\d{3})/i)?.[1];
        if (type) envelope.facturXType ??= `TypeCode ${type}`;
        const ref = text.match(DOC_REF_RX)?.[1];
        if (ref) envelope.documentNumber ??= ref.replace(/\s/g, '');
        rowConsumed = true;
        pending = null;
        return;
      }
      if (/^en\s+attente\s+de\s+signature/i.test(text)) {
        envelope.signatureStatus ??= 'PENDING';
        rowConsumed = true;
        return;
      }

      // 2) Étiquette « clé : valeur » (valeur en ligne ou sur la ligne suivante).
      const label = LABELS.find(({ rx }) => rx.test(text));
      if (label) {
        const inline = stripLabel(text, label.rx) || texts[ti + 1] || '';
        const ok = assign(label.key, inline);
        pending = ok && label.key !== 'emitterName' && label.key !== 'receiverName' ? null : label.key;
        rowConsumed = true;
        return;
      }

      // 3) Valeur reportée sur la ligne suivant l'étiquette.
      if (pending && assign(pending, text)) {
        if (pending !== 'emitterName' && pending !== 'receiverName') pending = null;
        rowConsumed = true;
        return;
      }

      // 4) Bloc d'en-tête initial sans étiquette → coordonnées de l'émetteur.
      if (index < headerLimit) {
        setParty('emitter', text);
        rowConsumed = true;
        return;
      }

      // 5) Bruit documentaire résiduel (« DQE », tirets, pagination…).
      if (isEnvelopeNoise(text)) {
        if (/^(dqe|devis|facture)$/i.test(text)) envelope.documentType ??= text.toUpperCase();
        rowConsumed = true;
      }
    });

    if (rowConsumed || isEnvelopeRow(texts)) consumed.add(index);
  });

  if (!envelope.documentNumber) {
    for (const texts of matrix.slice(0, 15)) {
      const hit = texts.join(' ').match(DOC_REF_RX)?.[1];
      if (hit) { envelope.documentNumber = hit.replace(/\s/g, ''); break; }
    }
  }
  return { envelope, consumedRows: [...consumed] };
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
