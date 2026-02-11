'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { ResumeData } from '@/types/resume';
import styles from '@/styles/ChatInterface.module.scss';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  resumeData: ResumeData;
  onReset: () => void;
}

export function ChatInterface({ resumeData, onReset }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'cloud' | 'local'>('cloud');
  const [difficulty, setDifficulty] = useState<'junior' | 'middle' | 'senior'>('middle');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          resumeData,
          model: selectedModel,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();

      // Add initial empty message
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
        },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;

          // Update the message with accumulated text
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: assistantMessage }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.toolbar}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>💼</div>
            <div className={styles.headerInfo}>
              <h1>Technical Interview Simulator</h1>
              <p>Interviewing: {resumeData.name}</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            {/* Difficulty Selector */}
            <div className={styles.selectorGroup}>
              <label htmlFor="difficulty-select">Difficulty</label>
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'junior' | 'middle' | 'senior')}
                className="btn-secondary"
              >
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            {/* Model Selector */}
            <div className={styles.selectorGroup}>
              <label htmlFor="model-select">Model</label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as 'cloud' | 'local')}
                className="btn-secondary"
              >
                <option value="cloud">Cloud (Fast)</option>
                <option value="local">Local (Custom)</option>
              </select>
            </div>

            <button onClick={onReset} className="btn-secondary">
              Upload New Resume
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className={styles.messagesArea}>
        <div className={styles.messagesContainer}>
          <div ref={scrollRef} className={styles.messagesList}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${message.role === 'user' ? styles.user : ''}`}
              >
                <div className={`${styles.messageAvatar} ${message.role === 'user' ? styles.userAvatar : styles.assistantAvatar}`}>
                  {message.role === 'user' ? '👤' : '🧑‍💼'}
                </div>

                <div className={`${styles.messageBubble} ${message.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className={styles.typingIndicator}>
                <div className={`${styles.messageAvatar} ${styles.assistantAvatar}`}>
                  🧑‍💼
                </div>
                <div className={styles.typingBubble}>
                  <div className={styles.dots}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={3}
              className={styles.textField}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`btn-primary ${styles.sendButton}`}
            >
              Send ➤
            </button>
          </form>
          <p className={styles.hint}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
