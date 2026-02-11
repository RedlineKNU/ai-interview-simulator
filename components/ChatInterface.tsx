'use client';

import { useState, useEffect, useRef, SyntheticEvent } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Send } from '@mui/icons-material';
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
  onBackToAnalysis: () => void;
}

export function ChatInterface({ resumeData, onReset, onBackToAnalysis }: ChatInterfaceProps) {
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

  const handleSubmit = async (e?: SyntheticEvent) => {
    e?.preventDefault();
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
      <AppBar position="static" elevation={0} color="inherit" className={styles.header}>
        <Toolbar sx={{ justifyContent: 'space-between', px: 3, py: 1, minHeight: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box className={styles.avatar}>💼</Box>
            <Box>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Technical Interview Simulator
              </Typography>
              <Typography variant="caption" component="p" sx={{ opacity: 0.85, mt: 0.25 }}>
                Interviewing: {resumeData.name}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 140 }} className={styles.selectorGroup}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value as 'junior' | 'middle' | 'senior')}
              >
                <MenuItem value="junior">Junior</MenuItem>
                <MenuItem value="middle">Middle</MenuItem>
                <MenuItem value="senior">Senior</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }} className={styles.selectorGroup}>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => setSelectedModel(e.target.value as 'cloud' | 'local')}
              >
                <MenuItem value="cloud">Cloud (Fast)</MenuItem>
                <MenuItem value="local">Local (Custom)</MenuItem>
              </Select>
            </FormControl>

            <button onClick={onBackToAnalysis} className="btn-secondary" style={{ minWidth: '160px' }}>
              Back to Analysis
            </button>

            <button onClick={onReset} className="btn-secondary" style={{ minWidth: '180px' }}>
              Upload New Resume
            </button>
          </Box>
        </Toolbar>
      </AppBar>

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
          <Box component="form" onSubmit={handleSubmit} className={styles.inputForm}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
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
              className={styles.textField}
            />
          </Box>
          <div className={styles.sendButtonRow}>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`btn-primary ${styles.sendButton}`}
              disabled={isLoading || !input.trim()}
            >
              <span>Send</span>
              <Send fontSize="small" />
            </button>
          </div>
          <Typography variant="caption" className={styles.hint}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </div>
      </div>
    </div>
  );
}
