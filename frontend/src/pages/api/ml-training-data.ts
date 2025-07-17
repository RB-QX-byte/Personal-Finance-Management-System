import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch transactions with categories for training
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        transaction_type,
        transaction_date,
        category_id,
        created_at,
        categories (
          id,
          name,
          description
        ),
        accounts (
          name,
          account_type
        )
      `)
      .eq('user_id', userId)
      .not('category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform data for ML training
    const trainingData = transactions?.map(transaction => ({
      id: transaction.id,
      description: transaction.description || '',
      amount: Math.abs(transaction.amount),
      merchant: extractMerchant(transaction.description || ''),
      category: transaction.categories?.name || '',
      categoryId: transaction.category_id,
      date: transaction.transaction_date,
      account: transaction.accounts?.name || '',
      transactionType: transaction.transaction_type as 'income' | 'expense',
      createdAt: transaction.created_at
    })) || [];

    return new Response(JSON.stringify(trainingData), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('ML training data API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { userId, feedbackData } = await request.json();
    
    if (!userId || !feedbackData) {
      return new Response(JSON.stringify({ error: 'User ID and feedback data are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store ML feedback for model improvement
    const { error } = await supabase
      .from('ml_feedback')
      .insert({
        user_id: userId,
        transaction_id: feedbackData.transactionId,
        predicted_category_id: feedbackData.predictedCategoryId,
        actual_category_id: feedbackData.actualCategoryId,
        confidence: feedbackData.confidence,
        was_correct: feedbackData.wasCorrect,
        model_version: feedbackData.modelVersion,
        prediction_sources: feedbackData.sources,
        created_at: new Date().toISOString()
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user's ML model accuracy stats
    await updateMLAccuracyStats(userId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML feedback API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function extractMerchant(description: string): string {
  // Simple merchant extraction logic
  const words = description.split(' ');
  
  // Look for common merchant indicators
  const merchantIndicators = ['at', 'from', 'to', '@'];
  
  for (const indicator of merchantIndicators) {
    const index = words.findIndex(word => word.toLowerCase() === indicator);
    if (index !== -1 && index < words.length - 1) {
      return words.slice(index + 1).join(' ').trim();
    }
  }
  
  // If no indicators found, take first few words
  return words.slice(0, 3).join(' ').trim();
}

async function updateMLAccuracyStats(userId: string): Promise<void> {
  try {
    // Get feedback statistics
    const { data: feedbackStats, error } = await supabase
      .from('ml_feedback')
      .select('was_correct, confidence, model_version')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching ML feedback stats:', error);
      return;
    }

    if (!feedbackStats || feedbackStats.length === 0) {
      return;
    }

    // Calculate accuracy metrics
    const totalPredictions = feedbackStats.length;
    const correctPredictions = feedbackStats.filter(f => f.was_correct).length;
    const accuracy = (correctPredictions / totalPredictions) * 100;

    // Calculate high-confidence accuracy
    const highConfidencePredictions = feedbackStats.filter(f => f.confidence >= 80);
    const highConfidenceCorrect = highConfidencePredictions.filter(f => f.was_correct).length;
    const highConfidenceAccuracy = highConfidencePredictions.length > 0 
      ? (highConfidenceCorrect / highConfidencePredictions.length) * 100 
      : 0;

    // Update or insert accuracy stats
    const { error: upsertError } = await supabase
      .from('ml_accuracy_stats')
      .upsert({
        user_id: userId,
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        accuracy_percentage: accuracy,
        high_confidence_predictions: highConfidencePredictions.length,
        high_confidence_correct: highConfidenceCorrect,
        high_confidence_accuracy: highConfidenceAccuracy,
        last_updated: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating ML accuracy stats:', upsertError);
    }

  } catch (error) {
    console.error('Error updating ML accuracy stats:', error);
  }
}