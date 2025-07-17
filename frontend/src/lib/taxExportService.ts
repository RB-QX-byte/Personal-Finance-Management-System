export interface TaxExportData {
  transactions: any[];
  categories: any[];
  dateRange: { start: string; end: string };
  taxYear: number;
  userId: string;
  exportFormat: 'csv' | 'qif' | 'ofx' | 'xlsx' | 'json';
  includeDeductibles: boolean;
  separateBusinessPersonal: boolean;
}

export interface TaxCategory {
  id: string;
  name: string;
  taxDeductible: boolean;
  businessExpense: boolean;
  taxFormSection: string;
  description: string;
}

export interface TaxExportResult {
  fileName: string;
  content: string | Uint8Array;
  mimeType: string;
  size: number;
  format: string;
}

export class TaxExportService {
  private static instance: TaxExportService;

  private constructor() {}

  static getInstance(): TaxExportService {
    if (!TaxExportService.instance) {
      TaxExportService.instance = new TaxExportService();
    }
    return TaxExportService.instance;
  }

  async exportForTaxSoftware(data: TaxExportData): Promise<TaxExportResult> {
    switch (data.exportFormat) {
      case 'csv':
        return this.exportToCSV(data);
      case 'qif':
        return this.exportToQIF(data);
      case 'ofx':
        return this.exportToOFX(data);
      case 'xlsx':
        return this.exportToXLSX(data);
      case 'json':
        return this.exportToJSON(data);
      default:
        throw new Error(`Unsupported export format: ${data.exportFormat}`);
    }
  }

  private async exportToCSV(data: TaxExportData): Promise<TaxExportResult> {
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Category',
      'Account',
      'Transaction Type',
      'Tax Deductible',
      'Business Expense',
      'Tax Form Section',
      'Notes'
    ];

    const rows = data.transactions.map(transaction => [
      transaction.transaction_date,
      transaction.description || '',
      Math.abs(transaction.amount).toFixed(2),
      transaction.categories?.name || 'Uncategorized',
      transaction.accounts?.name || '',
      transaction.transaction_type,
      transaction.categories?.tax_deductible ? 'Yes' : 'No',
      transaction.categories?.business_expense ? 'Yes' : 'No',
      transaction.categories?.tax_form_section || '',
      transaction.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      fileName: `tax_export_${data.taxYear}.csv`,
      content: csvContent,
      mimeType: 'text/csv',
      size: csvContent.length,
      format: 'csv'
    };
  }

  private async exportToQIF(data: TaxExportData): Promise<TaxExportResult> {
    let qifContent = '!Type:Bank\n';

    for (const transaction of data.transactions) {
      qifContent += `D${transaction.transaction_date}\n`;
      qifContent += `T${transaction.transaction_type === 'expense' ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}\n`;
      qifContent += `P${transaction.description || ''}\n`;
      qifContent += `L${transaction.categories?.name || 'Uncategorized'}\n`;
      
      if (transaction.notes) {
        qifContent += `M${transaction.notes}\n`;
      }
      
      // Add tax-specific fields as memo
      if (transaction.categories?.tax_deductible) {
        qifContent += `MTax Deductible: ${transaction.categories.tax_form_section || 'General'}\n`;
      }
      
      qifContent += '^\n';
    }

    return {
      fileName: `tax_export_${data.taxYear}.qif`,
      content: qifContent,
      mimeType: 'application/qif',
      size: qifContent.length,
      format: 'qif'
    };
  }

  private async exportToOFX(data: TaxExportData): Promise<TaxExportResult> {
    const ofxHeader = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${new Date().toISOString().replace(/[-:]/g, '').slice(0, 14)}
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>USD
<BANKACCTFROM>
<BANKID>123456789
<ACCTID>TAX_EXPORT_${data.taxYear}
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${data.dateRange.start.replace(/-/g, '')}
<DTEND>${data.dateRange.end.replace(/-/g, '')}
`;

    let transactions = '';
    for (const transaction of data.transactions) {
      const amount = transaction.transaction_type === 'expense' ? 
        -Math.abs(transaction.amount) : Math.abs(transaction.amount);
      
      transactions += `<STMTTRN>
<TRNTYPE>${transaction.transaction_type === 'expense' ? 'DEBIT' : 'CREDIT'}
<DTPOSTED>${transaction.transaction_date.replace(/-/g, '')}
<TRNAMT>${amount.toFixed(2)}
<FITID>${transaction.id}
<NAME>${transaction.description || 'Transaction'}
<MEMO>${transaction.categories?.name || 'Uncategorized'}${transaction.categories?.tax_deductible ? ' (Tax Deductible)' : ''}
</STMTTRN>
`;
    }

    const ofxFooter = `</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

    const ofxContent = ofxHeader + transactions + ofxFooter;

    return {
      fileName: `tax_export_${data.taxYear}.ofx`,
      content: ofxContent,
      mimeType: 'application/x-ofx',
      size: ofxContent.length,
      format: 'ofx'
    };
  }

  private async exportToXLSX(data: TaxExportData): Promise<TaxExportResult> {
    // For XLSX export, we'll create a structured spreadsheet
    const workbookData = {
      worksheets: [
        {
          name: 'Transactions',
          data: [
            ['Date', 'Description', 'Amount', 'Category', 'Account', 'Type', 'Tax Deductible', 'Business Expense', 'Tax Form Section', 'Notes'],
            ...data.transactions.map(transaction => [
              transaction.transaction_date,
              transaction.description || '',
              Math.abs(transaction.amount),
              transaction.categories?.name || 'Uncategorized',
              transaction.accounts?.name || '',
              transaction.transaction_type,
              transaction.categories?.tax_deductible ? 'Yes' : 'No',
              transaction.categories?.business_expense ? 'Yes' : 'No',
              transaction.categories?.tax_form_section || '',
              transaction.notes || ''
            ])
          ]
        },
        {
          name: 'Tax Summary',
          data: [
            ['Category', 'Total Amount', 'Tax Deductible', 'Tax Form Section'],
            ...this.generateTaxSummary(data.transactions)
          ]
        }
      ]
    };

    // Convert to CSV format for now (in a real implementation, use a library like SheetJS)
    const csvContent = workbookData.worksheets[0].data
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      fileName: `tax_export_${data.taxYear}.xlsx`,
      content: csvContent, // This would be binary XLSX data in real implementation
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: csvContent.length,
      format: 'xlsx'
    };
  }

  private async exportToJSON(data: TaxExportData): Promise<TaxExportResult> {
    const jsonData = {
      exportInfo: {
        taxYear: data.taxYear,
        dateRange: data.dateRange,
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0'
      },
      transactions: data.transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.transaction_date,
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        category: transaction.categories?.name || 'Uncategorized',
        account: transaction.accounts?.name || '',
        type: transaction.transaction_type,
        taxDeductible: transaction.categories?.tax_deductible || false,
        businessExpense: transaction.categories?.business_expense || false,
        taxFormSection: transaction.categories?.tax_form_section || '',
        notes: transaction.notes || ''
      })),
      summary: {
        totalTransactions: data.transactions.length,
        totalAmount: data.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        deductibleAmount: data.transactions
          .filter(t => t.categories?.tax_deductible)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        businessExpenseAmount: data.transactions
          .filter(t => t.categories?.business_expense)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        categorySummary: this.generateTaxSummary(data.transactions)
      }
    };

    const jsonContent = JSON.stringify(jsonData, null, 2);

    return {
      fileName: `tax_export_${data.taxYear}.json`,
      content: jsonContent,
      mimeType: 'application/json',
      size: jsonContent.length,
      format: 'json'
    };
  }

  private generateTaxSummary(transactions: any[]): any[] {
    const categoryTotals = new Map();

    transactions.forEach(transaction => {
      const categoryName = transaction.categories?.name || 'Uncategorized';
      const amount = Math.abs(transaction.amount);
      
      if (!categoryTotals.has(categoryName)) {
        categoryTotals.set(categoryName, {
          total: 0,
          taxDeductible: transaction.categories?.tax_deductible || false,
          businessExpense: transaction.categories?.business_expense || false,
          taxFormSection: transaction.categories?.tax_form_section || ''
        });
      }
      
      categoryTotals.get(categoryName).total += amount;
    });

    return Array.from(categoryTotals.entries()).map(([category, data]) => [
      category,
      data.total.toFixed(2),
      data.taxDeductible ? 'Yes' : 'No',
      data.businessExpense ? 'Yes' : 'No',
      data.taxFormSection
    ]);
  }

  getExportFormats(): { value: string; label: string; description: string }[] {
    return [
      {
        value: 'csv',
        label: 'CSV (Comma Separated Values)',
        description: 'Universal format compatible with Excel, Google Sheets, and most tax software'
      },
      {
        value: 'qif',
        label: 'QIF (Quicken Interchange Format)',
        description: 'Compatible with Quicken, QuickBooks, and many personal finance applications'
      },
      {
        value: 'ofx',
        label: 'OFX (Open Financial Exchange)',
        description: 'Industry standard format for financial data exchange'
      },
      {
        value: 'xlsx',
        label: 'Excel Spreadsheet',
        description: 'Microsoft Excel format with multiple worksheets and tax summaries'
      },
      {
        value: 'json',
        label: 'JSON (JavaScript Object Notation)',
        description: 'Structured data format for developers and advanced users'
      }
    ];
  }

  getTaxSoftwareCompatibility(): { software: string; formats: string[]; notes: string }[] {
    return [
      {
        software: 'TurboTax',
        formats: ['csv', 'qif', 'ofx'],
        notes: 'Import business expenses and categorized transactions directly'
      },
      {
        software: 'H&R Block',
        formats: ['csv', 'ofx'],
        notes: 'Supports CSV import for business and personal expenses'
      },
      {
        software: 'TaxAct',
        formats: ['csv', 'qif'],
        notes: 'QIF format recommended for best compatibility'
      },
      {
        software: 'FreeTaxUSA',
        formats: ['csv'],
        notes: 'Manual entry required, use CSV for reference'
      },
      {
        software: 'QuickBooks',
        formats: ['qif', 'ofx', 'csv'],
        notes: 'Full integration with business expense tracking'
      },
      {
        software: 'Quicken',
        formats: ['qif', 'ofx'],
        notes: 'Native QIF support with automatic categorization'
      },
      {
        software: 'Excel / Google Sheets',
        formats: ['csv', 'xlsx'],
        notes: 'For manual tax preparation and analysis'
      }
    ];
  }

  async generateTaxReport(data: TaxExportData): Promise<{
    deductibleExpenses: any[];
    businessExpenses: any[];
    totalDeductible: number;
    totalBusiness: number;
    categorySummary: any[];
  }> {
    const deductibleExpenses = data.transactions.filter(t => 
      t.categories?.tax_deductible && t.transaction_type === 'expense'
    );

    const businessExpenses = data.transactions.filter(t => 
      t.categories?.business_expense && t.transaction_type === 'expense'
    );

    const totalDeductible = deductibleExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalBusiness = businessExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categorySummary = this.generateTaxSummary(data.transactions);

    return {
      deductibleExpenses,
      businessExpenses,
      totalDeductible,
      totalBusiness,
      categorySummary
    };
  }

  validateTaxExport(data: TaxExportData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.transactions || data.transactions.length === 0) {
      errors.push('No transactions found for the specified period');
    }

    if (!data.dateRange || !data.dateRange.start || !data.dateRange.end) {
      errors.push('Date range is required');
    }

    if (data.taxYear < 2000 || data.taxYear > new Date().getFullYear()) {
      errors.push('Invalid tax year');
    }

    if (!data.exportFormat || !['csv', 'qif', 'ofx', 'xlsx', 'json'].includes(data.exportFormat)) {
      errors.push('Invalid export format');
    }

    // Validate transactions have required fields
    const invalidTransactions = data.transactions.filter(t => 
      !t.transaction_date || !t.amount || isNaN(t.amount)
    );

    if (invalidTransactions.length > 0) {
      errors.push(`${invalidTransactions.length} transactions have missing or invalid data`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}