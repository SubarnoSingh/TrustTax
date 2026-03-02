import React, { useState, useRef } from 'react';
import { uploadInvoice } from '../api';

const InvoiceUpload = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Only PDF files are supported.');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await uploadInvoice(file);
      if (data.error) {
        setError(data.error);
      } else {
        onAnalysisComplete(data);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to analyze invoice. Is the backend server online?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invoice-upload-section chart-container">
      <h3>Upload GST Invoice (PDF)</h3>
      
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {file ? 'Change selected file' : 'Drag & Drop PDF here'}
        </div>
        <div className="upload-hint">or</div>
        <button className="file-select-btn" type="button">
          Select File
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept=".pdf" 
          style={{ display: 'none' }}
        />
      </div>

      {file && (
        <div className="selected-file-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="selected-file">
            <span className="pdf-icon">📕</span>
            <span className="file-name">{file.name}</span>
          </div>
          <button 
            className="btn-primary" 
            onClick={(e) => { e.stopPropagation(); handleUpload(); }} 
            disabled={loading}
            style={{ marginTop: '1.5rem', width: '200px' }}
          >
            {loading ? 'Analyzing...' : 'Analyze Only This PDF'}
          </button>
        </div>
      )}

      {error && <p className="error-text" style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

export default InvoiceUpload;
