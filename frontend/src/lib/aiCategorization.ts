import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export interface TransactionData {
  description: string;
  amount: number;
  merchant?: string;
  date?: string;
  account?: string;
}

export interface CategoryPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
}

export interface AICategorizationResult {
  prediction: CategoryPrediction;
  alternatives: CategoryPrediction[];
  isHighConfidence: boolean;
}

export class AICategorizationService {
  private categories: any[] = [];
  private userTransactionHistory: any[] = [];

  constructor(categories: any[], userTransactionHistory: any[] = []) {
    this.categories = categories;
    this.userTransactionHistory = userTransactionHistory;
  }

  async categorizeTransaction(transaction: TransactionData): Promise<AICategorizationResult> {
    try {
      const prompt = this.buildCategorizationPrompt(transaction);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert financial advisor specialized in categorizing expenses and income. Analyze transactions and provide accurate category predictions with confidence scores."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const aiResponse = response.choices[0].message.content;
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('AI categorization error:', error);
      return this.getFallbackCategorization(transaction);
    }
  }

  async batchCategorizeTransactions(transactions: TransactionData[]): Promise<AICategorizationResult[]> {
    const results: AICategorizationResult[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchPromises = batch.map(transaction => this.categorizeTransaction(transaction));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay to respect rate limits
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  private buildCategorizationPrompt(transaction: TransactionData): string {
    const categoriesText = this.categories.map(cat => 
      `- ${cat.name}: ${cat.description || 'No description'}`
    ).join('\n');

    const historyExamples = this.getRelevantHistory(transaction);
    const historyText = historyExamples.length > 0 
      ? `\n\nSimilar past transactions:\n${historyExamples.map(h => 
          `- "${h.description}" -> ${h.category_name} (${h.confidence || 'manual'})`
        ).join('\n')}`
      : '';

    return `
Analyze this transaction and categorize it accurately:

Transaction Details:
- Description: "${transaction.description}"
- Amount: $${Math.abs(transaction.amount)}
- Merchant: ${transaction.merchant || 'Unknown'}
- Date: ${transaction.date || 'Unknown'}
- Account: ${transaction.account || 'Unknown'}

Available Categories:
${categoriesText}

${historyText}

Instructions:
1. Analyze the transaction description, amount, and merchant
2. Consider the user's past categorization patterns
3. Provide a primary category prediction with confidence score (0-100)
4. Include 2-3 alternative category suggestions
5. Explain your reasoning briefly

Return your response in this exact JSON format:
{
  "prediction": {
    "categoryId": "category_id_here",
    "categoryName": "category_name_here",
    "confidence": 95,
    "reasoning": "Brief explanation of why this category fits best"
  },
  "alternatives": [
    {
      "categoryId": "alt_category_id_1",
      "categoryName": "alt_category_name_1",
      "confidence": 75,
      "reasoning": "Why this could be an alternative"
    },
    {
      "categoryId": "alt_category_id_2",
      "categoryName": "alt_category_name_2",
      "confidence": 60,
      "reasoning": "Another possible categorization"
    }
  ],
  "isHighConfidence": true
}
    `;
  }

  private getRelevantHistory(transaction: TransactionData): any[] {
    // Find similar transactions based on description keywords
    const keywords = transaction.description.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    return this.userTransactionHistory
      .filter(hist => {
        const histDesc = hist.description.toLowerCase();
        return keywords.some(keyword => histDesc.includes(keyword));
      })
      .slice(0, 5); // Limit to 5 most relevant examples
  }

  private parseAIResponse(aiResponse: string | null): AICategorizationResult {
    if (!aiResponse) {
      return this.getFallbackCategorization();
    }

    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.prediction || !parsed.alternatives || !Array.isArray(parsed.alternatives)) {
        throw new Error('Invalid response structure');
      }

      return {
        prediction: parsed.prediction,
        alternatives: parsed.alternatives,
        isHighConfidence: parsed.isHighConfidence || parsed.prediction.confidence >= 80
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackCategorization();
    }
  }

  private getFallbackCategorization(transaction?: TransactionData): AICategorizationResult {
    // Use rule-based fallback categorization
    if (transaction) {
      const fallbackCategory = this.getRuleBasedCategory(transaction);
      return {
        prediction: {
          categoryId: fallbackCategory.id,
          categoryName: fallbackCategory.name,
          confidence: 60,
          reasoning: 'Rule-based categorization (AI unavailable)'
        },
        alternatives: [],
        isHighConfidence: false
      };
    }

    // Default fallback
    const defaultCategory = this.categories.find(cat => 
      cat.name.toLowerCase().includes('other') || 
      cat.name.toLowerCase().includes('miscellaneous')
    ) || this.categories[0];

    return {
      prediction: {
        categoryId: defaultCategory?.id || 'unknown',
        categoryName: defaultCategory?.name || 'Uncategorized',
        confidence: 30,
        reasoning: 'Default categorization (AI unavailable)'
      },
      alternatives: [],
      isHighConfidence: false
    };
  }

  private getRuleBasedCategory(transaction: TransactionData): any {
    const description = transaction.description.toLowerCase();
    
    // Simple rule-based categorization
    const rules = [
      { keywords: ['grocery', 'supermarket', 'food', 'restaurant', 'dining', 'coffee'], category: 'Food & Dining' },
      { keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'transport'], category: 'Transportation' },
      { keywords: ['amazon', 'shopping', 'store', 'retail'], category: 'Shopping' },
      { keywords: ['netflix', 'spotify', 'entertainment', 'movie'], category: 'Entertainment' },
      { keywords: ['electric', 'utility', 'phone', 'internet', 'bill'], category: 'Bills & Utilities' },
      { keywords: ['medical', 'doctor', 'pharmacy', 'health'], category: 'Healthcare' },
      { keywords: ['salary', 'payroll', 'wage', 'income'], category: 'Salary' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => description.includes(keyword))) {
        const category = this.categories.find(cat => cat.name === rule.category);
        if (category) return category;
      }
    }

    // Return default category if no rules match
    return this.categories[0] || { id: 'unknown', name: 'Uncategorized' };
  }
}

export async function createAICategorizationService(userId: string): Promise<AICategorizationService> {
  try {
    // Fetch user's categories
    const categoriesResponse = await fetch(`/api/categories?userId=${userId}`);
    const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];

    // Fetch user's transaction history for learning
    const historyResponse = await fetch(`/api/transactions?userId=${userId}&limit=200`);
    const history = historyResponse.ok ? await historyResponse.json() : [];

    return new AICategorizationService(categories, history);
  } catch (error) {
    console.error('Failed to create AI categorization service:', error);
    return new AICategorizationService([]);
  }
}