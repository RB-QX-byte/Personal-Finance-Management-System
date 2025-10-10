import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true,
    uppercase: true
  },
  targetCurrency: {
    type: String,
    required: true,
    uppercase: true
  },
  rate: {
    type: Number,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1, timestamp: -1 });

export default mongoose.model('ExchangeRate', exchangeRateSchema);
