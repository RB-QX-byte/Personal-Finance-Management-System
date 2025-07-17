import OpenAI from 'openai';

export interface TrainingData {
  description: string;
  amount: number;
  merchant?: string;
  category: string;
  categoryId: string;
  date: string;
  account?: string;
  transactionType: 'income' | 'expense';
}

export interface MLModel {
  patterns: Map<string, CategoryPattern>;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  lastTrained: Date;
  version: string;
}

export interface CategoryPattern {
  categoryId: string;
  categoryName: string;
  keywords: string[];
  amountRanges: { min: number; max: number; frequency: number }[];
  merchantPatterns: string[];
  confidence: number;
  frequency: number;
  examples: string[];
}

export interface EnhancedPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
  modelVersion: string;
  sources: ('patterns' | 'ai' | 'rules')[];
}

export class MLCategorizationEngine {
  private openai: OpenAI;
  private model: MLModel;
  private categories: any[] = [];
  private trainingData: TrainingData[] = [];

  constructor(openaiKey: string, categories: any[], trainingData: TrainingData[] = []) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.categories = categories;
    this.trainingData = trainingData;
    this.model = this.initializeModel();
  }

  private initializeModel(): MLModel {
    return {
      patterns: new Map(),
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      lastTrained: new Date(),
      version: '1.0.0'
    };
  }

  async trainModel(): Promise<void> {
    console.log('Training ML model with', this.trainingData.length, 'samples');
    
    // Clear existing patterns
    this.model.patterns.clear();
    
    // Group training data by category
    const categoryGroups = this.groupByCategory(this.trainingData);
    
    // Train patterns for each category
    for (const [categoryId, transactions] of categoryGroups) {
      const pattern = await this.trainCategoryPattern(categoryId, transactions);
      this.model.patterns.set(categoryId, pattern);
    }
    
    // Calculate model accuracy from historical data
    await this.calculateModelAccuracy();
    
    this.model.lastTrained = new Date();
    console.log('Model training completed. Accuracy:', this.model.accuracy.toFixed(2) + '%');
  }

  private groupByCategory(data: TrainingData[]): Map<string, TrainingData[]> {
    const groups = new Map<string, TrainingData[]>();
    
    for (const transaction of data) {
      const existing = groups.get(transaction.categoryId) || [];
      existing.push(transaction);
      groups.set(transaction.categoryId, existing);
    }
    
    return groups;
  }

  private async trainCategoryPattern(categoryId: string, transactions: TrainingData[]): Promise<CategoryPattern> {
    const category = this.categories.find(c => c.id === categoryId);
    const categoryName = category?.name || 'Unknown';
    
    // Extract keywords using frequency analysis and AI
    const keywords = await this.extractKeywords(transactions);
    
    // Analyze amount patterns
    const amountRanges = this.analyzeAmountPatterns(transactions);
    
    // Extract merchant patterns
    const merchantPatterns = this.extractMerchantPatterns(transactions);
    
    // Calculate confidence based on data consistency
    const confidence = this.calculatePatternConfidence(transactions);
    
    return {
      categoryId,
      categoryName,
      keywords,
      amountRanges,
      merchantPatterns,
      confidence,
      frequency: transactions.length,
      examples: transactions.slice(0, 5).map(t => t.description)
    };
  }

  private async extractKeywords(transactions: TrainingData[]): Promise<string[]> {
    const descriptions = transactions.map(t => t.description.toLowerCase());
    
    // Frequency analysis
    const wordFreq = new Map<string, number>();
    
    for (const desc of descriptions) {
      const words = desc.split(/\s+/).filter(word => 
        word.length > 2 && 
        !this.isStopWord(word) && 
        !this.isNumericOrDate(word)
      );
      
      for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    
    // Get top keywords by frequency
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
    
    // Use AI to refine keywords
    const refinedKeywords = await this.refineKeywordsWithAI(sortedWords, descriptions);
    
    return refinedKeywords;
  }

  private async refineKeywordsWithAI(keywords: string[], descriptions: string[]): Promise<string[]> {
    try {
      const prompt = `
Given these transaction descriptions and extracted keywords, identify the most relevant keywords for categorization:

Sample descriptions:
${descriptions.slice(0, 10).join('\n')}

Extracted keywords:
${keywords.join(', ')}

Return only the most relevant keywords (maximum 10) that best identify this category of transactions. Consider:
1. Keywords that appear frequently and consistently
2. Keywords that are specific to this transaction type
3. Keywords that would help distinguish this category from others

Return as a comma-separated list of keywords only.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a financial categorization expert. Analyze transaction data and extract the most relevant keywords." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const refinedKeywords = response.choices[0].message.content
        ?.split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0) || keywords;

      return refinedKeywords.slice(0, 10);
    } catch (error) {
      console.error('Error refining keywords with AI:', error);
      return keywords.slice(0, 10);
    }
  }

  private analyzeAmountPatterns(transactions: TrainingData[]): { min: number; max: number; frequency: number }[] {
    const amounts = transactions.map(t => Math.abs(t.amount)).sort((a, b) => a - b);
    
    if (amounts.length === 0) return [];
    
    // Create ranges based on quartiles
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const q2 = amounts[Math.floor(amounts.length * 0.5)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];
    const max = amounts[amounts.length - 1];
    
    const ranges = [
      { min: 0, max: q1, frequency: 0 },
      { min: q1, max: q2, frequency: 0 },
      { min: q2, max: q3, frequency: 0 },
      { min: q3, max: max, frequency: 0 }
    ];
    
    // Count frequencies
    for (const amount of amounts) {
      for (const range of ranges) {
        if (amount >= range.min && amount <= range.max) {
          range.frequency++;
          break;
        }
      }
    }
    
    return ranges.filter(r => r.frequency > 0);
  }

  private extractMerchantPatterns(transactions: TrainingData[]): string[] {
    const merchants = transactions
      .map(t => t.merchant || '')
      .filter(m => m.length > 0)
      .map(m => m.toLowerCase());
    
    const merchantFreq = new Map<string, number>();
    
    for (const merchant of merchants) {
      merchantFreq.set(merchant, (merchantFreq.get(merchant) || 0) + 1);
    }
    
    // Return merchants that appear more than once
    return Array.from(merchantFreq.entries())
      .filter(([_, freq]) => freq > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([merchant]) => merchant);
  }

  private calculatePatternConfidence(transactions: TrainingData[]): number {
    if (transactions.length < 3) return 60; // Low confidence for small datasets
    
    const descriptions = transactions.map(t => t.description.toLowerCase());
    const uniqueWords = new Set(descriptions.join(' ').split(/\s+/));
    const totalWords = descriptions.join(' ').split(/\s+/).length;
    
    // Higher confidence for more consistent patterns
    const consistencyScore = (uniqueWords.size / totalWords) * 100;
    const frequencyScore = Math.min(transactions.length / 10, 1) * 100;
    
    return Math.min(80, (consistencyScore + frequencyScore) / 2);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    return stopWords.includes(word.toLowerCase());
  }

  private isNumericOrDate(word: string): boolean {
    return /^\d+$/.test(word) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(word);
  }

  async predictCategory(transaction: {
    description: string;
    amount: number;
    merchant?: string;
    date?: string;
  }): Promise<EnhancedPrediction[]> {
    const predictions: EnhancedPrediction[] = [];
    
    // Get pattern-based predictions
    const patternPredictions = this.getPatternPredictions(transaction);
    predictions.push(...patternPredictions);
    
    // Get AI-based predictions
    const aiPredictions = await this.getAIPredictions(transaction);
    predictions.push(...aiPredictions);
    
    // Get rule-based predictions
    const rulePredictions = this.getRulePredictions(transaction);
    predictions.push(...rulePredictions);
    
    // Combine and rank predictions
    const combinedPredictions = this.combinePredictions(predictions);
    
    return combinedPredictions.slice(0, 3); // Return top 3 predictions
  }

  private getPatternPredictions(transaction: any): EnhancedPrediction[] {
    const predictions: EnhancedPrediction[] = [];
    const description = transaction.description.toLowerCase();
    const amount = Math.abs(transaction.amount);
    
    for (const [categoryId, pattern] of this.model.patterns) {
      let score = 0;
      const reasons: string[] = [];
      
      // Check keyword matches
      const keywordMatches = pattern.keywords.filter(keyword => 
        description.includes(keyword)
      );
      
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 30;
        reasons.push(`Keywords: ${keywordMatches.join(', ')}`);
      }
      
      // Check amount ranges
      const amountMatch = pattern.amountRanges.find(range => 
        amount >= range.min && amount <= range.max
      );
      
      if (amountMatch) {
        score += (amountMatch.frequency / pattern.frequency) * 20;
        reasons.push(`Amount range: $${amountMatch.min}-$${amountMatch.max}`);
      }
      
      // Check merchant patterns
      if (transaction.merchant) {
        const merchantMatch = pattern.merchantPatterns.find(merchant => 
          transaction.merchant.toLowerCase().includes(merchant)
        );
        
        if (merchantMatch) {
          score += 25;
          reasons.push(`Merchant: ${merchantMatch}`);
        }
      }
      
      // Adjust score based on pattern confidence and frequency
      score = (score * pattern.confidence / 100) * Math.min(pattern.frequency / 10, 1);
      
      if (score > 10) {
        predictions.push({
          categoryId,
          categoryName: pattern.categoryName,
          confidence: Math.min(95, score),
          reasoning: reasons.join(', '),
          modelVersion: this.model.version,
          sources: ['patterns']
        });
      }
    }
    
    return predictions;
  }

  private async getAIPredictions(transaction: any): Promise<EnhancedPrediction[]> {
    try {
      const prompt = `
Categorize this transaction based on the available categories and your expertise:

Transaction: ${transaction.description}
Amount: $${Math.abs(transaction.amount)}
Merchant: ${transaction.merchant || 'Unknown'}

Available categories:
${this.categories.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')}

Analyze the transaction and provide your top 2 category predictions with confidence scores.

Return in JSON format:
{
  "predictions": [
    {
      "categoryId": "category_id_here",
      "categoryName": "category_name_here",
      "confidence": 85,
      "reasoning": "Brief explanation"
    }
  ]
}
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a financial categorization expert. Analyze transactions and provide accurate category predictions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{"predictions": []}');
      
      return result.predictions.map((pred: any) => ({
        ...pred,
        modelVersion: this.model.version,
        sources: ['ai'] as ('patterns' | 'ai' | 'rules')[]
      }));
    } catch (error) {
      console.error('Error getting AI predictions:', error);
      return [];
    }
  }

  private getRulePredictions(transaction: any): EnhancedPrediction[] {
    const predictions: EnhancedPrediction[] = [];
    const description = transaction.description.toLowerCase();
    
    const rules = [
      { keywords: ['grocery', 'supermarket', 'food', 'restaurant', 'dining', 'coffee'], category: 'Food & Dining', confidence: 75 },
      { keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'transport'], category: 'Transportation', confidence: 75 },
      { keywords: ['amazon', 'shopping', 'store', 'retail', 'walmart', 'target'], category: 'Shopping', confidence: 70 },
      { keywords: ['netflix', 'spotify', 'entertainment', 'movie', 'streaming'], category: 'Entertainment', confidence: 80 },
      { keywords: ['electric', 'utility', 'phone', 'internet', 'bill', 'cable'], category: 'Bills & Utilities', confidence: 85 },
      { keywords: ['medical', 'doctor', 'pharmacy', 'health', 'hospital'], category: 'Healthcare', confidence: 80 },
      { keywords: ['salary', 'payroll', 'wage', 'income', 'dividend'], category: 'Salary', confidence: 90 },
    ];

    for (const rule of rules) {
      const matches = rule.keywords.filter(keyword => description.includes(keyword));
      if (matches.length > 0) {
        const category = this.categories.find(c => c.name === rule.category);
        if (category) {
          predictions.push({
            categoryId: category.id,
            categoryName: category.name,
            confidence: rule.confidence,
            reasoning: `Rule-based match: ${matches.join(', ')}`,
            modelVersion: this.model.version,
            sources: ['rules']
          });
        }
      }
    }

    return predictions;
  }

  private combinePredictions(predictions: EnhancedPrediction[]): EnhancedPrediction[] {
    const categoryScores = new Map<string, {
      prediction: EnhancedPrediction;
      totalScore: number;
      sourceCount: number;
    }>();

    // Combine predictions for the same category
    for (const pred of predictions) {
      const existing = categoryScores.get(pred.categoryId);
      if (existing) {
        existing.totalScore += pred.confidence;
        existing.sourceCount += 1;
        existing.prediction.sources = [...new Set([...existing.prediction.sources, ...pred.sources])];
        existing.prediction.reasoning += '; ' + pred.reasoning;
      } else {
        categoryScores.set(pred.categoryId, {
          prediction: pred,
          totalScore: pred.confidence,
          sourceCount: 1
        });
      }
    }

    // Calculate final scores and sort
    const finalPredictions = Array.from(categoryScores.values())
      .map(({ prediction, totalScore, sourceCount }) => ({
        ...prediction,
        confidence: Math.min(95, totalScore / sourceCount * (1 + sourceCount * 0.1)) // Boost confidence for multiple sources
      }))
      .sort((a, b) => b.confidence - a.confidence);

    return finalPredictions;
  }

  private async calculateModelAccuracy(): Promise<void> {
    if (this.trainingData.length < 10) {
      this.model.accuracy = 60; // Default accuracy for small datasets
      return;
    }

    let correctPredictions = 0;
    const testSize = Math.min(50, Math.floor(this.trainingData.length * 0.2));
    const testData = this.trainingData.slice(-testSize); // Use most recent data for testing

    for (const testTransaction of testData) {
      try {
        const predictions = await this.predictCategory({
          description: testTransaction.description,
          amount: testTransaction.amount,
          merchant: testTransaction.merchant,
          date: testTransaction.date
        });

        if (predictions.length > 0 && predictions[0].categoryId === testTransaction.categoryId) {
          correctPredictions++;
        }
      } catch (error) {
        console.error('Error testing prediction:', error);
      }
    }

    this.model.accuracy = (correctPredictions / testSize) * 100;
    this.model.totalPredictions = testSize;
    this.model.correctPredictions = correctPredictions;
  }

  getModelStats(): {
    accuracy: number;
    totalPredictions: number;
    correctPredictions: number;
    lastTrained: Date;
    version: string;
    patternCount: number;
  } {
    return {
      accuracy: this.model.accuracy,
      totalPredictions: this.model.totalPredictions,
      correctPredictions: this.model.correctPredictions,
      lastTrained: this.model.lastTrained,
      version: this.model.version,
      patternCount: this.model.patterns.size
    };
  }

  async addTrainingData(newData: TrainingData[]): Promise<void> {
    this.trainingData.push(...newData);
    
    // Retrain model if we have enough new data
    if (newData.length >= 10) {
      await this.trainModel();
    }
  }

  exportModel(): string {
    const exportData = {
      patterns: Object.fromEntries(this.model.patterns),
      accuracy: this.model.accuracy,
      totalPredictions: this.model.totalPredictions,
      correctPredictions: this.model.correctPredictions,
      lastTrained: this.model.lastTrained,
      version: this.model.version
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  importModel(modelData: string): void {
    try {
      const data = JSON.parse(modelData);
      this.model = {
        patterns: new Map(Object.entries(data.patterns)),
        accuracy: data.accuracy,
        totalPredictions: data.totalPredictions,
        correctPredictions: data.correctPredictions,
        lastTrained: new Date(data.lastTrained),
        version: data.version
      };
    } catch (error) {
      console.error('Error importing model:', error);
    }
  }
}

export async function createMLEngine(userId: string): Promise<MLCategorizationEngine> {
  try {
    // Fetch user's categories
    const categoriesResponse = await fetch(`/api/categories?userId=${userId}`);
    const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];

    // Fetch training data (historical transactions with categories)
    const trainingResponse = await fetch(`/api/ml-training-data?userId=${userId}`);
    const trainingData = trainingResponse.ok ? await trainingResponse.json() : [];

    const engine = new MLCategorizationEngine(
      import.meta.env.OPENAI_API_KEY,
      categories,
      trainingData
    );

    // Train the model if we have enough data
    if (trainingData.length >= 10) {
      await engine.trainModel();
    }

    return engine;
  } catch (error) {
    console.error('Failed to create ML engine:', error);
    throw error;
  }
}