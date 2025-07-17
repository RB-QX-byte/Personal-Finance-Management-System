import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { createMLEngine } from '../../lib/mlCategorization';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { transaction, userId } = await request.json();
    
    if (!transaction || !userId) {
      return new Response(JSON.stringify({ error: 'Transaction and userId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create ML engine for user
    const mlEngine = await createMLEngine(userId);
    
    // Get predictions from ML engine
    const predictions = await mlEngine.predictCategory({
      description: transaction.description,
      amount: transaction.amount,
      merchant: transaction.merchant,
      date: transaction.date
    });

    // Get model statistics
    const modelStats = mlEngine.getModelStats();

    // Log prediction for analytics
    await logMLPrediction(userId, transaction, predictions, modelStats);

    const result = {
      predictions,
      modelStats,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML categorization error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const { userId, trainingData } = await request.json();
    
    if (!userId || !trainingData) {
      return new Response(JSON.stringify({ error: 'User ID and training data are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create ML engine
    const mlEngine = await createMLEngine(userId);
    
    // Add new training data
    await mlEngine.addTrainingData(trainingData);
    
    // Get updated model statistics
    const modelStats = mlEngine.getModelStats();

    // Store model export for persistence
    const modelExport = mlEngine.exportModel();
    await storeUserModel(userId, modelExport, modelStats);

    return new Response(JSON.stringify({ 
      success: true, 
      modelStats,
      message: 'Model updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML model update error:', error);
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
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get ML model statistics
    const { data: modelStats, error } = await supabase
      .from('ml_accuracy_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get recent prediction analytics
    const { data: recentPredictions, error: predError } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (predError) {
      console.error('Error fetching recent predictions:', predError);
    }

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(recentPredictions || []);

    const result = {
      modelStats: modelStats || {
        accuracy_percentage: 0,
        total_predictions: 0,
        correct_predictions: 0,
        high_confidence_accuracy: 0,
        last_updated: new Date().toISOString()
      },
      performanceMetrics,
      recentPredictions: recentPredictions?.slice(0, 20) || []
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML stats API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function logMLPrediction(userId: string, transaction: any, predictions: any[], modelStats: any): Promise<void> {
  try {
    if (predictions.length === 0) return;

    const primaryPrediction = predictions[0];
    
    const { error } = await supabase
      .from('ml_predictions')
      .insert({
        user_id: userId,
        transaction_description: transaction.description,
        transaction_amount: transaction.amount,
        predicted_category_id: primaryPrediction.categoryId,
        confidence: primaryPrediction.confidence,
        reasoning: primaryPrediction.reasoning,
        model_version: primaryPrediction.modelVersion,
        prediction_sources: primaryPrediction.sources,
        alternatives: JSON.stringify(predictions.slice(1, 3)),
        model_accuracy: modelStats.accuracy,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log ML prediction:', error);
    }
  } catch (error) {
    console.error('Error logging ML prediction:', error);
  }
}

async function storeUserModel(userId: string, modelExport: string, modelStats: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_ml_models')
      .upsert({
        user_id: userId,
        model_data: modelExport,
        accuracy: modelStats.accuracy,
        total_predictions: modelStats.totalPredictions,
        correct_predictions: modelStats.correctPredictions,
        pattern_count: modelStats.patternCount,
        last_trained: modelStats.lastTrained,
        model_version: modelStats.version,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store user model:', error);
    }
  } catch (error) {
    console.error('Error storing user model:', error);
  }
}

function calculatePerformanceMetrics(predictions: any[]): any {
  if (predictions.length === 0) {
    return {
      averageConfidence: 0,
      highConfidenceRate: 0,
      sourceDistribution: {},
      accuracyTrend: []
    };
  }

  // Calculate average confidence
  const totalConfidence = predictions.reduce((sum, pred) => sum + (pred.confidence || 0), 0);
  const averageConfidence = totalConfidence / predictions.length;

  // Calculate high confidence rate
  const highConfidencePredictions = predictions.filter(pred => pred.confidence >= 80);
  const highConfidenceRate = (highConfidencePredictions.length / predictions.length) * 100;

  // Calculate source distribution
  const sourceDistribution: { [key: string]: number } = {};
  predictions.forEach(pred => {
    const sources = pred.prediction_sources || [];
    sources.forEach((source: string) => {
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
    });
  });

  // Calculate accuracy trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentPredictions = predictions.filter(pred => 
    new Date(pred.created_at) >= thirtyDaysAgo
  );

  const accuracyTrend = recentPredictions.map(pred => ({
    date: pred.created_at,
    accuracy: pred.model_accuracy || 0,
    confidence: pred.confidence || 0
  }));

  return {
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    highConfidenceRate: Math.round(highConfidenceRate * 100) / 100,
    sourceDistribution,
    accuracyTrend,
    totalPredictions: predictions.length,
    recentPredictions: recentPredictions.length
  };
}