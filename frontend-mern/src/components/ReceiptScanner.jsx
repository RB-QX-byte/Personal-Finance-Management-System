import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { quickScan, validateReceiptImage } from '../services/receiptScanner';
import './ReceiptScanner.css';

/**
 * Receipt Scanner Component
 * Allows users to upload receipt images, performs OCR, and extracts transaction data
 */
const ReceiptScanner = ({ onDataExtracted, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false,
    onDrop: handleFileDrop
  });

  function handleFileDrop(acceptedFiles) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file
    const validation = validateReceiptImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setScanResult(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select a receipt image first');
      return;
    }

    try {
      setIsScanning(true);
      setProgress(0);
      setError(null);

      const result = await quickScan(selectedFile, (progressValue) => {
        setProgress(Math.round(progressValue * 100));
      });

      setScanResult(result);
      setProgress(100);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = () => {
    if (scanResult && scanResult.extractedData) {
      onDataExtracted(scanResult.extractedData);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="receipt-scanner">
      <h2>📸 Scan Receipt</h2>
      <p className="scanner-description">
        Upload a receipt image to automatically extract transaction details
      </p>

      {/* File Upload Area */}
      {!previewUrl && (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <div className="dropzone-icon">📁</div>
            {isDragActive ? (
              <p>Drop the receipt image here...</p>
            ) : (
              <>
                <p>Drag & drop a receipt image here</p>
                <p className="dropzone-or">or</p>
                <button type="button" className="btn-browse">
                  Browse Files
                </button>
                <p className="dropzone-hint">
                  Supports: JPG, PNG, WebP (Max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && !scanResult && (
        <div className="preview-section">
          <div className="preview-header">
            <h3>Receipt Preview</h3>
            <button onClick={handleReset} className="btn-change-image">
              Change Image
            </button>
          </div>
          <div className="image-preview">
            <img src={previewUrl} alt="Receipt preview" />
          </div>
          {selectedFile && (
            <div className="file-info">
              <p>
                <strong>File:</strong> {selectedFile.name}
              </p>
              <p>
                <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {isScanning && (
        <div className="scanning-progress">
          <div className="progress-header">
            <span>Scanning receipt...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-hint">
            {progress < 50
              ? 'Processing image...'
              : progress < 80
              ? 'Extracting text...'
              : 'Analyzing data...'}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && scanResult.success && (
        <div className="scan-result">
          <div className="result-header">
            <h3>✅ Scan Complete!</h3>
            <span className="confidence-indicator">
              Confidence: {scanResult.confidence?.toFixed(0)}%
            </span>
          </div>

          <div className="extracted-data">
            <h4>Extracted Data:</h4>
            <div className="data-grid">
              <div className="data-item">
                <label>Merchant:</label>
                <span>{scanResult.extractedData.description || 'Unknown'}</span>
              </div>
              <div className="data-item">
                <label>Amount:</label>
                <span>${scanResult.extractedData.amount || '0.00'}</span>
              </div>
              <div className="data-item">
                <label>Date:</label>
                <span>{scanResult.extractedData.date || 'Not found'}</span>
              </div>
              {scanResult.extractedData.items &&
                scanResult.extractedData.items.length > 0 && (
                  <div className="data-item items-list">
                    <label>Items:</label>
                    <ul>
                      {scanResult.extractedData.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>

          {/* OCR Text (expandable) */}
          <details className="ocr-text-section">
            <summary>View OCR Text</summary>
            <pre className="ocr-text">{scanResult.ocrText}</pre>
          </details>

          <div className="result-actions">
            <button onClick={handleUseData} className="btn btn-primary">
              Use This Data
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {previewUrl && !scanResult && !isScanning && (
        <div className="scanner-actions">
          <button
            onClick={handleScan}
            className="btn btn-primary"
            disabled={!selectedFile}
          >
            🔍 Scan Receipt
          </button>
          {onCancel && (
            <button onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;
