import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { AICategorizationService } from '../../lib/aiCategorization';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { transaction, userId } = await request.json();
    
    if (!transaction || !userId) {
      return new Response(JSON.stringify({ error: 'Transaction and userId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (categoriesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's transaction history for learning
    const { data: history, error: historyError } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (id, name)
      `)
      .eq('user_id', userId)
      .not('category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (historyError) {
      console.error('Failed to fetch transaction history:', historyError);
    }

    // Create AI categorization service
    const aiService = new AICategorizationService(categories || [], history || []);
    
    // Categorize the transaction
    const result = await aiService.categorizeTransaction(transaction);
    
    // Log the categorization for improvement
    await logCategorization(userId, transaction, result);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('AI categorization error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST_BATCH: APIRoute = async ({ request, cookies }) => {
  try {
    const { transactions, userId } = await request.json();
    
    if (!transactions || !Array.isArray(transactions) || !userId) {
      return new Response(JSON.stringify({ error: 'Transactions array and userId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's categories and history
    const [categoriesResponse, historyResponse] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('transactions')
        .select(`
          *,
          categories (id, name)
        `)
        .eq('user_id', userId)
        .not('category_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200)
    ]);

    if (categoriesResponse.error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create AI categorization service
    const aiService = new AICategorizationService(
      categoriesResponse.data || [], 
      historyResponse.data || []
    );
    
    // Batch categorize transactions
    const results = await aiService.batchCategorizeTransactions(transactions);
    
    // Log batch categorization
    await Promise.all(
      results.map((result, index) => 
        logCategorization(userId, transactions[index], result)
      )
    );
    
    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Batch AI categorization error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function logCategorization(userId: string, transaction: any, result: any) {
  try {
    const { error } = await supabase
      .from('ai_categorization_logs')
      .insert({
        user_id: userId,
        transaction_description: transaction.description,
        transaction_amount: transaction.amount,
        predicted_category_id: result.prediction.categoryId,
        confidence: result.prediction.confidence,
        reasoning: result.prediction.reasoning,
        alternatives: JSON.stringify(result.alternatives),
        is_high_confidence: result.isHighConfidence,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to log AI categorization:', error);
    }
  } catch (error) {
    console.error('Error logging categorization:', error);
  }
}