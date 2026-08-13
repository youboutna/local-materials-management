import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface PaginationOptions {
  pageSize: number;
  includeHeaders: boolean;
  includePageNumbers: boolean;
}

export class ReportFormatting {
  
  /**
   * Generate paginated HTML table with professional styling
   */
  static generatePaginatedTable<T>(
    rows: T[],
    columns: Array<{ label: string; render: (row: T, idx: number) => string; width?: string }>,
    options: Partial<PaginationOptions> = {},
    sectionTitle = ''
  ): string {
    const { pageSize = 25, includeHeaders = true, includePageNumbers = true } = options;
    
    if (rows.length === 0) {
      return this.generateEmptyState(sectionTitle);
    }

    const pages = this.paginateArray(rows, pageSize);
    
    return pages.map((page, pageIndex) => `
      <section style="margin-bottom: 30px; page-break-inside: avoid; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ${sectionTitle ? `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">
              ${sectionTitle}${pages.length > 1 ? ` (Page ${pageIndex + 1}/${pages.length})` : ''}
            </h2>
          </div>
        ` : ''}
        
        <div style="padding: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: white;">
            ${includeHeaders ? `
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  ${columns.map(col => `
                    <th style="
                      padding: 12px 8px; 
                      text-align: left; 
                      font-weight: 600; 
                      color: #374151;
                      border-bottom: 1px solid #e5e7eb;
                      ${col.width ? `width: ${col.width};` : ''}
                    ">
                      ${col.label}
                    </th>
                  `).join('')}
                </tr>
              </thead>
            ` : ''}
            
            <tbody>
              ${page.map((row, idx) => `
                <tr style="
                  ${idx % 2 === 0 ? 'background: #ffffff;' : 'background: #f9fafb;'}
                  border-bottom: 1px solid #e5e7eb;
                  transition: background-color 0.2s ease;
                ">
                  ${columns.map(col => `
                    <td style="
                      padding: 12px 8px; 
                      vertical-align: top; 
                      line-height: 1.5;
                      color: #374151;
                      border-bottom: 1px solid #f1f5f9;
                    ">
                      ${col.render(row, idx)}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${includePageNumbers && pages.length > 1 ? `
            <div style="
              text-align: right; 
              margin-top: 15px; 
              padding-top: 15px; 
              border-top: 1px solid #e5e7eb;
              font-size: 12px; 
              color: #6b7280;
            ">
              Page ${pageIndex + 1} sur ${pages.length}
            </div>
          ` : ''}
        </div>
      </section>
      ${pageIndex < pages.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
    `).join('');
  }

  /**
   * Generate empty state for sections with no data
   */
  private static generateEmptyState(sectionTitle: string): string {
    return `
      <section style="margin-bottom: 30px; page-break-inside: avoid;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${sectionTitle}</h2>
        </div>
        <div style="background: #f8fafc; padding: 40px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📊</div>
          <p style="margin: 0; font-size: 16px;">Aucune donnée disponible pour cette section.</p>
        </div>
      </section>
    `;
  }

  /**
   * Paginate array into chunks
   */
  private static paginateArray<T>(arr: T[], pageSize: number): T[][] {
    const pages: T[][] = [];
    for (let i = 0; i < arr.length; i += pageSize) {
      pages.push(arr.slice(i, i + pageSize));
    }
    return pages;
  }

  /**
   * Format currency with French locale
   */
  static formatCurrency(amount: number, currency = 'MRU'): string {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }

  /**
   * Format date with French locale
   */
  static formatDate(date: string | Date, formatString = 'dd/MM/yyyy'): string {
    try {
      return format(new Date(date), formatString, { locale: fr });
    } catch {
      return 'Date invalide';
    }
  }

  /**
   * Format percentage with precision
   */
  static formatPercentage(value: number, precision = 2): string {
    return `${value.toFixed(precision)}%`;
  }

  /**
   * Generate status badge HTML
   */
  static generateStatusBadge(status: string, customColors?: Record<string, string>): string {
    const defaultColors = {
      'en cours': 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;',
      'terminé': 'background: #dcfce7; color: #166534; border: 1px solid #86efac;',
      'en attente': 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
      'en inspection': 'background: #fed7aa; color: #c2410c; border: 1px solid #fdba74;',
      'suspendu': 'background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;',
      'annulé': 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;',
      'approved': 'background: #dcfce7; color: #166534; border: 1px solid #86efac;',
      'rejected': 'background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;',
      'pending': 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
      'completed': 'background: #dcfce7; color: #166534; border: 1px solid #86efac;',
      'active': 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;'
    };

    const colors = { ...defaultColors, ...customColors };
    const style = colors[status.toLowerCase()] || colors['en attente'];

    return `
      <span style="
        ${style}
        padding: 4px 8px; 
        border-radius: 6px; 
        font-size: 12px; 
        font-weight: 500;
        display: inline-block;
      ">
        ${status}
      </span>
    `;
  }

  /**
   * Generate metric card HTML
   */
  static generateMetricCard(
    title: string, 
    value: string, 
    color = '#3b82f6',
    icon?: string
  ): string {
    return `
      <div style="
        background: white; 
        padding: 20px; 
        border-radius: 8px; 
        text-align: center; 
        border-left: 4px solid ${color};
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ">
        ${icon ? `<div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>` : ''}
        <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 500;">${title}</h4>
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${color};">${value}</p>
      </div>
    `;
  }

  /**
   * Generate progress bar HTML
   */
  static generateProgressBar(
    progress: number, 
    color = '#3b82f6',
    height = '8px',
    showPercentage = true
  ): string {
    return `
      <div style="margin: 8px 0;">
        ${showPercentage ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #6b7280;">Progression</span>
            <span style="font-size: 12px; font-weight: 600; color: ${color};">${progress}%</span>
          </div>
        ` : ''}
        <div style="
          width: 100%; 
          height: ${height}; 
          background: #e5e7eb; 
          border-radius: 4px; 
          overflow: hidden;
        ">
          <div style="
            height: 100%; 
            background: ${color}; 
            width: ${Math.min(100, Math.max(0, progress))}%;
            transition: width 0.3s ease;
            border-radius: 4px;
          "></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate section header with gradient background
   */
  static generateSectionHeader(
    title: string, 
    subtitle?: string,
    gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  ): string {
    return `
      <div style="
        background: ${gradient}; 
        padding: 24px; 
        color: white; 
        border-radius: 8px 8px 0 0;
        margin-bottom: 0;
      ">
        <h2 style="margin: 0 0 ${subtitle ? '8px' : '0'} 0; font-size: 24px; font-weight: 600;">${title}</h2>
        ${subtitle ? `<p style="margin: 0; font-size: 14px; opacity: 0.9;">${subtitle}</p>` : ''}
      </div>
    `;
  }
}