/**
 * ContractPdfService — export PDF d'un contrat (entête + lignes figées).
 * Service pur : reçoit des DTO, ne lit jamais la base directement.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';
import type { ContractLineDTO } from '@/dtos/entities/ContractLineDTO';
import { computeContractLineTotals } from '@/dtos/entities/ContractLineDTO';
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from './ContractService';

const money = (value: number, currency: string) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value || 0)} ${currency}`;

const day = (value: string | null) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

export interface ContractPdfOptions {
  organizationName?: string;
  supplierName?: string;
  projectName?: string;
}

export class ContractPdfService {
  buildDocument(
    contract: ContractRecordDTO,
    lines: ContractLineDTO[],
    options: ContractPdfOptions = {},
  ): jsPDF {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const totals = computeContractLineTotals(lines);

    doc.setFontSize(16);
    doc.text('CONTRAT / BON DE COMMANDE', 14, 18);

    doc.setFontSize(10);
    doc.text(`N° ${contract.contractNumber}`, 14, 26);
    doc.text(`Statut : ${CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}`, 14, 32);
    doc.text(`Type : ${CONTRACT_TYPE_LABELS[contract.contractType] ?? contract.contractType}`, 14, 38);

    doc.setFontSize(12);
    doc.text(contract.title, 14, 48, { maxWidth: 180 });

    const meta: string[][] = [
      ['Maître d\'ouvrage', options.organizationName ?? '—'],
      ['Titulaire', options.supplierName ?? String((contract.metadata as any)?.supplierName ?? '—')],
      ['Projet', options.projectName ?? '—'],
      ['Date de début', day(contract.startDate)],
      ['Date de fin', day(contract.endDate)],
      ['Signé le', day(contract.signedAt)],
    ];

    autoTable(doc, {
      startY: 56,
      head: [['Rubrique', 'Valeur']],
      body: meta,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 60, 90] },
      theme: 'grid',
    });

    const afterMeta = (doc as any).lastAutoTable?.finalY ?? 90;

    if (lines.length > 0) {
      autoTable(doc, {
        startY: afterMeta + 8,
        head: [['Code', 'Désignation', 'Unité', 'Qté', 'P.U.', 'Montant HT', 'TVA %']],
        body: lines.map((l) => [
          l.lineCode ?? '—',
          l.designation,
          l.unit ?? '—',
          new Intl.NumberFormat('fr-FR').format(l.quantity),
          new Intl.NumberFormat('fr-FR').format(l.unitPrice),
          new Intl.NumberFormat('fr-FR').format(l.amountHt),
          `${l.vatRate}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 60, 90] },
        theme: 'striped',
      });
    }

    const afterLines = (doc as any).lastAutoTable?.finalY ?? afterMeta + 8;

    autoTable(doc, {
      startY: afterLines + 6,
      body: [
        ['Total HT', money(totals.amountHt || contract.totalAmount, contract.currency)],
        ['TVA', money(totals.vatAmount, contract.currency)],
        ['Total TTC', money(totals.amountTtc || contract.totalAmount, contract.currency)],
      ],
      styles: { fontSize: 10, fontStyle: 'bold' },
      theme: 'plain',
      columnStyles: { 0: { cellWidth: 60 }, 1: { halign: 'right' } },
    });

    return doc;
  }

  download(
    contract: ContractRecordDTO,
    lines: ContractLineDTO[],
    options: ContractPdfOptions = {},
  ): void {
    const doc = this.buildDocument(contract, lines, options);
    doc.save(`${contract.contractNumber || 'contrat'}.pdf`);
  }
}

let instance: ContractPdfService | null = null;

export function getContractPdfService(): ContractPdfService {
  if (!instance) instance = new ContractPdfService();
  return instance;
}
