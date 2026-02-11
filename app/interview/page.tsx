'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/ChatInterface';
import { ResumeData } from '@/types/resume';

export default function InterviewPage() {
  const router = useRouter();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve resume data from localStorage
    const storedData = localStorage.getItem('resumeData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setResumeData(data);
      } catch (error) {
        console.error('Failed to parse resume data:', error);
        router.push('/');
      }
    } else {
      // No resume data, redirect to upload
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  const handleReset = () => {
    localStorage.removeItem('resumeData');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  if (!resumeData) {
    return null; // Will redirect in useEffect
  }

  return <ChatInterface resumeData={resumeData} onReset={handleReset} />;
}
