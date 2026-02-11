'use client';

import { useRouter } from 'next/navigation';
import { ResumeUpload } from '@/components/ResumeUpload';
import { ResumeData } from '@/types/resume';
import styles from '@/styles/Home.module.scss';

export default function Home() {
  const router = useRouter();

  const handleResumeExtracted = (data: ResumeData) => {
    // Store resume data in localStorage
    localStorage.setItem('resumeData', JSON.stringify(data));
    // Navigate to analysis page
    router.push('/analysis');
  };

  return (
    <div className={styles.uploadStage}>
      <div className={styles.heroSection}>
        <h1>AI Interview Simulator</h1>
        <p>
          Practice your technical interviews with an AI Senior Tech Lead.
          Upload your resume to get started with personalized questions.
        </p>
      </div>
      <ResumeUpload onResumeExtracted={handleResumeExtracted} />
    </div>
  );
}
