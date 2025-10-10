import api from './api';
import { saveAs } from 'file-saver';

/**
 * Tax export and tracking service
 * Handles tax-deductible expenses, business expenses, and tax report exports
 */

/**
 * Get all tax-deductible transactions for a year
 * @param {number} year - Tax year
 * @returns {Promise<Array>} Array of tax-deductible transactions
 */
export const getTaxDeductibleTransactions = async (year) => {
  try {
    const response = await api.get('/tax/deductible', {
      params: { year }
    });

    return response.data;
  } catch (error) {
    console.error('Get tax deductible transactions error:', error);
    throw error;
  }
};

/**
 * Get all business expense transactions for a year
 * @param {number} year - Tax year
 * @returns {Promise<Array>} Array of business expense transactions
 */
export const getBusinessExpenses = async (year) => {
  try {
    const response = await api.get('/tax/business-expenses', {
      params: { year }
    });

    return response.data;
  } catch (error) {
    console.error('Get business expenses error:', error);
    throw error;
  }
};

/**
 * Export tax data in specified format
 * @param {number} year - Tax year
 * @param {string} format - Export format ('csv', 'excel', 'pdf', 'json')
 * @returns {Promise<Blob>} File blob for download
 */
export const exportTaxData = async (year, format = 'csv') => {
  try {
    const response = await api.post('/tax/export', {
      year,
      format
    }, {
      responseType: 'blob' // Important for file download
    });

    return response.data;
  } catch (error) {
    console.error('Export tax data error:', error);
    throw error;
  }
};

/**
 * Download tax report file
 * @param {number} year - Tax year
 * @param {string} format - File format ('csv', 'excel', 'pdf', 'json')
 * @param {string} filename - Optional custom filename
 */
export const downloadTaxReport = async (year, format = 'csv', filename = null) => {
  try {
    const blob = await exportTaxData(year, format);

    // Generate filename if not provided
    if (!filename) {
      const extensions = {
        csv: 'csv',
        excel: 'xlsx',
        pdf: 'pdf',
        json: 'json'
      };

      const ext = extensions[format] || 'csv';
      filename = `tax-report-${year}.${ext}`;
    }

    // Trigger download
    saveAs(blob, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Download tax report error:', error);
    throw error;
  }
};

/**
 * Get tax summary for a year
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Tax summary with totals by category
 */
export const getTaxSummary = async (year) => {
  try {
    const response = await api.get('/tax/summary', {
      params: { year }
    });

    return response.data;
  } catch (error) {
    console.error('Get tax summary error:', error);
    throw error;
  }
};

/**
 * Mark transaction as tax-deductible
 * @param {string} transactionId - Transaction ID
 * @param {boolean} isTaxDeductible - Whether transaction is tax-deductible
 * @returns {Promise<Object>} Updated transaction
 */
export const markTaxDeductible = async (transactionId, isTaxDeductible) => {
  try {
    const response = await api.patch(`/transactions/${transactionId}`, {
      taxDeductible: isTaxDeductible
    });

    return response.data;
  } catch (error) {
    console.error('Mark tax deductible error:', error);
    throw error;
  }
};

/**
 * Mark transaction as business expense
 * @param {string} transactionId - Transaction ID
 * @param {boolean} isBusinessExpense - Whether transaction is a business expense
 * @returns {Promise<Object>} Updated transaction
 */
export const markBusinessExpense = async (transactionId, isBusinessExpense) => {
  try {
    const response = await api.patch(`/transactions/${transactionId}`, {
      businessExpense: isBusinessExpense
    });

    return response.data;
  } catch (error) {
    console.error('Mark business expense error:', error);
    throw error;
  }
};

/**
 * Get tax categories with their settings
 * @returns {Promise<Array>} Array of categories with tax settings
 */
export const getTaxCategories = async () => {
  try {
    const response = await api.get('/categories');
    const categories = response.data;

    // Filter to only tax-related categories
    return categories.filter(cat =>
      cat.taxDeductible || cat.businessExpense || cat.taxFormSection
    );
  } catch (error) {
    console.error('Get tax categories error:', error);
    throw error;
  }
};

/**
 * Update category tax settings
 * @param {string} categoryId - Category ID
 * @param {Object} taxSettings - Tax settings object
 * @param {boolean} taxSettings.taxDeductible - Is tax-deductible
 * @param {boolean} taxSettings.businessExpense - Is business expense
 * @param {string} taxSettings.taxFormSection - Tax form section
 * @returns {Promise<Object>} Updated category
 */
export const updateCategoryTaxSettings = async (categoryId, taxSettings) => {
  try {
    const response = await api.put(`/categories/${categoryId}`, taxSettings);
    return response.data;
  } catch (error) {
    console.error('Update category tax settings error:', error);
    throw error;
  }
};

/**
 * Calculate estimated tax savings
 * @param {number} year - Tax year
 * @param {number} taxRate - Tax rate as percentage (e.g., 25 for 25%)
 * @returns {Promise<Object>} Estimated tax savings
 */
export const calculateTaxSavings = async (year, taxRate = 25) => {
  try {
    const deductible = await getTaxDeductibleTransactions(year);
    const business = await getBusinessExpenses(year);

    const totalDeductible = deductible.reduce((sum, t) => sum + t.amount, 0);
    const totalBusiness = business.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = totalDeductible + totalBusiness;

    const estimatedSavings = (totalExpenses * taxRate) / 100;

    return {
      year,
      taxRate,
      totalDeductibleExpenses: totalDeductible,
      totalBusinessExpenses: totalBusiness,
      totalTaxableExpenses: totalExpenses,
      estimatedTaxSavings: estimatedSavings,
      currency: 'USD' // TODO: Get from user preferences
    };
  } catch (error) {
    console.error('Calculate tax savings error:', error);
    throw error;
  }
};

/**
 * Get tax filing checklist
 * @param {number} year - Tax year
 * @returns {Promise<Object>} Checklist with completion status
 */
export const getTaxChecklist = async (year) => {
  try {
    const summary = await getTaxSummary(year);

    const checklist = [
      {
        id: 'deductible',
        title: 'Review Tax-Deductible Expenses',
        description: 'Ensure all deductible expenses are properly categorized',
        completed: summary.deductibleCount > 0,
        count: summary.deductibleCount
      },
      {
        id: 'business',
        title: 'Review Business Expenses',
        description: 'Verify all business expenses are marked correctly',
        completed: summary.businessExpenseCount > 0,
        count: summary.businessExpenseCount
      },
      {
        id: 'receipts',
        title: 'Collect Receipt Documentation',
        description: 'Gather receipts for all claimed expenses',
        completed: false,
        manual: true
      },
      {
        id: 'export',
        title: 'Export Tax Report',
        description: 'Download and save your tax report',
        completed: false,
        action: () => downloadTaxReport(year, 'pdf')
      }
    ];

    return {
      year,
      checklist,
      completionPercentage: (checklist.filter(item => item.completed).length / checklist.length) * 100
    };
  } catch (error) {
    console.error('Get tax checklist error:', error);
    throw error;
  }
};

/**
 * Supported export formats
 */
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json'
};

/**
 * Tax form sections (IRS Schedule C for US)
 */
export const TAX_FORM_SECTIONS = [
  { value: 'advertising', label: 'Advertising' },
  { value: 'car_truck', label: 'Car and Truck Expenses' },
  { value: 'commissions', label: 'Commissions and Fees' },
  { value: 'depreciation', label: 'Depreciation' },
  { value: 'insurance', label: 'Insurance (other than health)' },
  { value: 'interest_mortgage', label: 'Interest: Mortgage' },
  { value: 'interest_other', label: 'Interest: Other' },
  { value: 'legal', label: 'Legal and Professional Services' },
  { value: 'office', label: 'Office Expense' },
  { value: 'rent_lease', label: 'Rent or Lease' },
  { value: 'repairs', label: 'Repairs and Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'taxes_licenses', label: 'Taxes and Licenses' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other Expenses' }
];

export default {
  getTaxDeductibleTransactions,
  getBusinessExpenses,
  exportTaxData,
  downloadTaxReport,
  getTaxSummary,
  markTaxDeductible,
  markBusinessExpense,
  getTaxCategories,
  updateCategoryTaxSettings,
  calculateTaxSavings,
  getTaxChecklist,
  EXPORT_FORMATS,
  TAX_FORM_SECTIONS
};
