'use client';

import { useState, useCallback } from 'react';
import { extractResumeData } from '@/lib/actions/resume';
import { ResumeData } from '@/types/resume';
import styles from '@/styles/ResumeUpload.module.scss';

interface ResumeUploadProps {
  onResumeExtracted: (data: ResumeData) => void;
}

export function ResumeUpload({ onResumeExtracted }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const result = await extractResumeData(formData);

      if (result.success && result.data) {
        onResumeExtracted(result.data);
      } else {
        setError(result.error || 'Failed to process resume');
        setFileName(null);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setFileName(null);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [onResumeExtracted]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const dropZoneClass = `${styles.dropZone} ${isDragging ? styles.dragging : ''} ${isProcessing ? styles.processing : ''}`;

  return (
    <div className={styles.uploadContainer}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={dropZoneClass}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className={styles.hiddenInput}
          id="resume-upload"
          disabled={isProcessing}
        />

        <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'block' }}>
          {isProcessing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className={styles.loadingSpinner}>⏳</div>
              <h3 className={styles.uploadTitle}>
                Analyzing your resume...
              </h3>
              <p className={styles.fileName}>
                {fileName}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className={styles.uploadIcon}>📄</div>
              <h3 className={styles.uploadTitle}>
                {isDragging ? 'Drop your resume here' : 'Upload your resume'}
              </h3>
              <p className={styles.uploadSubtitle}>
                Drag and drop or click to select a PDF file
              </p>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.infoText}>
        <p>Your resume will be analyzed by AI to personalize the interview.</p>
        <p>All data is processed securely and never stored permanently.</p>
      </div>
    </div>
  );
}
