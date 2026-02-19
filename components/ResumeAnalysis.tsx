'use client';

import { useState, useEffect } from 'react';
import { ResumeData } from '@/types/resume';
import styles from '@/styles/ResumeAnalysis.module.scss';

interface ResumeAnalysisProps {
  resumeData: ResumeData;
  onStartInterview: () => void;
  onBack: () => void;
}

interface AnalysisResult {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillsCoverage: {
    technical: number;
    soft: number;
    total: number;
  };
  summary: string;
}

export function ResumeAnalysis({ resumeData, onStartInterview, onBack }: ResumeAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function analyzeResume() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/analyze-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeData }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze resume');
        }

        const result = await response.json();
        setAnalysis(result);
      } catch (err) {
        console.error('Analysis error:', err);
        setError('Failed to analyze resume. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    analyzeResume();
  }, [resumeData]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={`card ${styles.loadingCard}`}>
          <div className={styles.statusIcon}>⏳</div>
          <h2 className={styles.statusTitle}>Analyzing Your Resume</h2>
          <p className={styles.statusSubtitle}>
            Our AI is evaluating your experience, skills, and qualifications...
          </p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className={styles.errorContainer}>
        <div className={`card ${styles.errorCard}`}>
          <div className={styles.statusIcon}>⚠️</div>
          <h2 className={styles.statusTitle}>Analysis Failed</h2>
          <p className={`${styles.statusSubtitle} ${styles.errorMessage}`}>
            {error}
          </p>
          <button onClick={onBack} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return styles.scoreGreen;
    if (score >= 60) return styles.scoreYellow;
    return styles.scoreRed;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  };

  return (
    <div className={styles.analysisPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Resume Analysis</h1>
            <p>AI-powered evaluation of {resumeData.name}'s profile</p>
          </div>
          <button onClick={onBack} className="btn-secondary">
            Upload Different Resume
          </button>
        </div>

        {/* Overall Score Card */}
        <div className={`card ${styles.overallScoreCard}`}>
          <div className={styles.overallScoreLayout}>
            <div>
              <h2 className={styles.overallScoreText}>Overall Resume Score</h2>
              <p className={styles.overallScoreDescription}>
                {analysis.summary}
              </p>
            </div>
            <div className={styles.overallScoreDetails}>
              <div className={styles.overallScoreValueWrapper}>
                <div
                  className={`${styles.overallScoreValue} ${getScoreColor(analysis.overallScore)}`}
                >
                  {analysis.overallScore}
                </div>
                <p className={styles.overallScoreSuffix}>
                  out of 100
                </p>
              </div>
              <div className={`chip ${styles.scoreChip}`}>
                {getScoreLabel(analysis.overallScore)}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Scores Grid */}
        <div className={styles.scoreGrid}>
          {/* Skills Score */}
          <div className={`card ${styles.scoreCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🎯</span>
              <h3>Skills Assessment</h3>
            </div>

            <div className={styles.scoreSection}>
              <div className={styles.scoreRow}>
                <div className={`${styles.scoreValue} ${getScoreColor(analysis.skillsScore)}`}>
                  {analysis.skillsScore}%
                </div>
                <div className="chip">
                  {getScoreLabel(analysis.skillsScore)}
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${analysis.skillsScore}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.statsSection}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Technical Skills:</span>
                <span className={styles.statValue}>{analysis.skillsCoverage.technical}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Soft Skills:</span>
                <span className={styles.statValue}>{analysis.skillsCoverage.soft}</span>
              </div>
              <div className={`${styles.statRow} ${styles.divider}`}>
                <span className={styles.statLabel}>Total Skills:</span>
                <span className={styles.statValue}>{analysis.skillsCoverage.total}</span>
              </div>
            </div>
          </div>

          {/* Experience Score */}
          <div className={`card ${styles.scoreCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💼</span>
              <h3>Experience Quality</h3>
            </div>

            <div className={styles.scoreSection}>
              <div className={styles.scoreRow}>
                <div className={`${styles.scoreValue} ${getScoreColor(analysis.experienceScore)}`}>
                  {analysis.experienceScore}%
                </div>
                <div className="chip">
                  {getScoreLabel(analysis.experienceScore)}
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${analysis.experienceScore}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.statsSection}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Total Positions:</span>
                <span className={styles.statValue}>{resumeData.experience.length}</span>
              </div>
              <div className={styles.statDetail}>
                {resumeData.experience.length > 0
                  ? `Most recent: ${resumeData.experience[0].position}`
                  : 'No experience listed'}
              </div>
            </div>
          </div>

          {/* Education Score */}
          <div className={`card ${styles.scoreCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🎓</span>
              <h3>Education Level</h3>
            </div>

            <div className={styles.scoreSection}>
              <div className={styles.scoreRow}>
                <div className={`${styles.scoreValue} ${getScoreColor(analysis.educationScore)}`}>
                  {analysis.educationScore}%
                </div>
                <div className="chip">
                  {getScoreLabel(analysis.educationScore)}
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${analysis.educationScore}%` }}
                ></div>
              </div>
            </div>

            <div className={styles.statsSection}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Degrees:</span>
                <span className={styles.statValue}>{resumeData.education.length}</span>
              </div>
              <div className={styles.statDetail}>
                {resumeData.education.length > 0
                  ? `${resumeData.education[0].degree} in ${resumeData.education[0].field}`
                  : 'No education listed'}
              </div>
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className={styles.strengthsWeaknessesGrid}>
          {/* Strengths */}
          <div className={`card ${styles.listCard}`}>
            <div className={styles.listHeader}>
              <span className={`${styles.cardIcon} ${styles.successIcon}`}>🏆</span>
              <h3>Key Strengths</h3>
            </div>
            <ul>
              {analysis.strengths.map((strength, index) => (
                <li key={index}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={styles.successIcon}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className={`card ${styles.listCard}`}>
            <div className={styles.listHeader}>
              <span className={`${styles.cardIcon} ${styles.warningIcon}`}>📈</span>
              <h3>Areas for Improvement</h3>
            </div>
            <ul>
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={styles.warningIcon}>
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className={`card ${styles.recommendationsCard}`}>
          <div className={styles.recommendationsHeader}>
            <h3>AI Recommendations</h3>
            <p>Personalized tips to improve your resume and interview performance</p>
          </div>
          <ul>
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index}>
                <div className={styles.numberBadge}>
                  {index + 1}
                </div>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            onClick={onBack}
            className={`btn-secondary ${styles.secondaryAction}`}
          >
            Upload Different Resume
          </button>
          <button
            onClick={onStartInterview}
            className={`btn-primary ${styles.primaryAction}`}
          >
            Start Technical Interview
          </button>
        </div>
      </div>
    </div>
  );
}
