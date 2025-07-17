import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { TaxExportService } from '../../lib/taxExportService';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { 
      userId, 
      taxYear, 
      exportFormat, 
      includeDeductibles, 
      separateBusinessPersonal,
      dateRange 
    } = await request.json();
    
    if (!userId || !taxYear || !exportFormat) {
      return new Response(JSON.stringify({ 
        error: 'userId, taxYear, and exportFormat are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate date range if not provided
    const startDate = dateRange?.start || `${taxYear}-01-01`;
    const endDate = dateRange?.end || `${taxYear}-12-31`;

    // Fetch transactions for the tax year
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          id,
          name,
          tax_deductible,
          business_expense,
          tax_form_section,
          description
        ),
        accounts (
          id,
          name,
          account_type
        )
      `)
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true });

    if (transactionsError) {
      return new Response(JSON.stringify({ error: transactionsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch categories for reference
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (categoriesError) {
      return new Response(JSON.stringify({ error: categoriesError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter transactions if needed
    let filteredTransactions = transactions || [];
    
    if (includeDeductibles) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.categories?.tax_deductible || t.categories?.business_expense
      );
    }

    // Prepare export data
    const exportData = {
      transactions: filteredTransactions,
      categories: categories || [],
      dateRange: { start: startDate, end: endDate },
      taxYear,
      userId,
      exportFormat,
      includeDeductibles: includeDeductibles || false,
      separateBusinessPersonal: separateBusinessPersonal || false
    };

    // Generate export
    const taxExportService = TaxExportService.getInstance();
    const validationResult = taxExportService.validateTaxExport(exportData);
    
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ 
        error: 'Export validation failed',
        details: validationResult.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const exportResult = await taxExportService.exportForTaxSoftware(exportData);

    // Log export activity
    await logTaxExport(userId, taxYear, exportFormat, filteredTransactions.length);

    return new Response(JSON.stringify({
      success: true,
      export: exportResult,
      summary: {
        totalTransactions: filteredTransactions.length,
        dateRange: { start: startDate, end: endDate },
        exportFormat,
        fileName: exportResult.fileName
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tax export error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taxExportService = TaxExportService.getInstance();

    if (action === 'formats') {
      const formats = taxExportService.getExportFormats();
      return new Response(JSON.stringify({ formats }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'compatibility') {
      const compatibility = taxExportService.getTaxSoftwareCompatibility();
      return new Response(JSON.stringify({ compatibility }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'tax-categories') {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .or('tax_deductible.eq.true,business_expense.eq.true');

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ categories }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'tax-summary') {
      const taxYear = parseInt(url.searchParams.get('taxYear') || new Date().getFullYear().toString());
      const startDate = `${taxYear}-01-01`;
      const endDate = `${taxYear}-12-31`;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            tax_deductible,
            business_expense,
            tax_form_section
          )
        `)
        .eq('user_id', userId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('transaction_type', 'expense');

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const taxReport = await taxExportService.generateTaxReport({
        transactions: transactions || [],
        categories: [],
        dateRange: { start: startDate, end: endDate },
        taxYear,
        userId,
        exportFormat: 'json',
        includeDeductibles: false,
        separateBusinessPersonal: false
      });

      return new Response(JSON.stringify(taxReport), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tax export API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function logTaxExport(userId: string, taxYear: number, exportFormat: string, transactionCount: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('tax_exports')
      .insert({
        user_id: userId,
        tax_year: taxYear,
        export_format: exportFormat,
        transaction_count: transactionCount,
        exported_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log tax export:', error);
    }
  } catch (error) {
    console.error('Error logging tax export:', error);
  }
}