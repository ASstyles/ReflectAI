import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  X,
  Lock,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { auth } from '../lib/firebase';
import type { AskJournalResponse } from '../types';

interface AskJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  'What goals have I mentioned recently?',
  'What themes keep appearing in my reflections?',
  'What ideas have I discussed?',
  'What should I focus on next?',
];

export const AskJournalModal: React.FC<AskJournalModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskJournalResponse | null>(null);
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState('');
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAskQuestion = async (queryToAsk?: string) => {
    const targetQuestion = (queryToAsk !== undefined ? queryToAsk : question).trim();
    if (!targetQuestion || loading) return;

    setLoading(true);
    setError(null);
    setLastSubmittedQuestion(targetQuestion);

    try {
      // 1. Obtain fresh Firebase ID Token for authenticated UID verification
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('You must be signed in with your Google account to ask your journal.');
      }

      // 2. Call backend endpoint
      const res = await fetch('/api/journal/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          question: targetQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to search your journal.');
      }

      setResult(data as AskJournalResponse);

      // Scroll to answer after response arrives
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.error('Ask My Journal error:', err);
      setError(err?.message || 'Unable to search your journal right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const handleCopy = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setQuestion('');
    setResult(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div
      id="ask-journal-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ask-journal-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-300 flex items-center justify-center shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-stone-900 tracking-tight">Ask My Journal</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                  Personal Synthesis
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Ask questions about your own reflections, ideas, goals, and previous conversations.
              </p>
            </div>
          </div>
          <button
            id="close-ask-journal-btn"
            onClick={onClose}
            aria-label="Close Ask My Journal modal"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* Privacy Indicator Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-900 text-xs">
            <div className="flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-medium">
                🔒 Your question is searched only against your private journal.
              </span>
            </div>
            <span className="hidden sm:inline text-[11px] text-emerald-700">Owner-isolated UID</span>
          </div>

          {/* Question Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <label htmlFor="ask-journal-input" className="font-semibold text-stone-700">
                What would you like to ask your journal?
              </label>
              <span className={question.length > 900 ? 'text-amber-600 font-semibold' : ''}>
                {question.length}/1000
              </span>
            </div>

            <div className="relative rounded-xl border border-stone-300 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 transition-all bg-white shadow-2xs">
              <textarea
                id="ask-journal-input"
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 1000))}
                onKeyDown={handleKeyDown}
                placeholder="e.g., What recurring goals or themes have I mentioned recently?"
                rows={3}
                disabled={loading}
                className="w-full p-3.5 text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none bg-transparent"
              />

              <div className="p-2.5 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 hidden sm:inline">
                  Press <kbd className="px-1 py-0.5 bg-stone-200 rounded text-[10px]">Enter</kbd> to ask, <kbd className="px-1 py-0.5 bg-stone-200 rounded text-[10px]">Shift+Enter</kbd> for newline
                </span>

                <div className="flex items-center space-x-2 ml-auto">
                  {result && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer"
                    >
                      Clear Answer
                    </button>
                  )}

                  <button
                    id="submit-ask-journal-btn"
                    onClick={() => handleAskQuestion()}
                    disabled={!question.trim() || loading}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ask Journal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Questions */}
          {!result && !loading && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-stone-500">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Suggested prompts to explore your history:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestion(sq);
                      handleAskQuestion(sq);
                    }}
                    className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 text-left text-xs font-medium text-stone-700 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="line-clamp-2">{sq}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              id="ask-journal-error-banner"
              className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-xs sm:text-sm"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Unable to search your journal</p>
                <p className="text-red-700 mt-0.5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAskQuestion(lastSubmittedQuestion)}
                className="px-2.5 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-900 text-xs font-medium transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col items-center justify-center space-y-3 text-center animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-md">
                <Brain className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Synthesizing your private reflections...
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Scanning your previous entries and structuring insights with Gemini
                </p>
              </div>
            </div>
          )}

          {/* Answer Presentation Area */}
          {result && !loading && (
            <div ref={answerRef} className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Journal Synthesis
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Queried: &ldquo;{lastSubmittedQuestion}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold border border-stone-200">
                    {result.modelUsed !== 'none' ? `Model: ${result.modelUsed}` : 'Direct Analysis'}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition cursor-pointer flex items-center space-x-1 text-xs"
                    title="Copy Answer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 text-[11px] font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Formatted Markdown Answer */}
              <div className="p-5 rounded-2xl bg-stone-50/90 border border-stone-200 text-stone-800 text-sm leading-relaxed prose prose-stone max-w-none">
                <div className="markdown-body">
                  <Markdown>{result.answer}</Markdown>
                </div>
              </div>

              {/* Referenced Journal Entries (Citations) */}
              {result.sources && result.sources.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Analyzed Reflection Entries ({result.sources.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((src) => (
                      <div
                        key={src.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-medium text-stone-700 shadow-2xs flex items-center space-x-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="truncate max-w-[200px]">{src.title}</span>
                        {src.mode && (
                          <span className="text-[9px] uppercase px-1 py-0.2 bg-stone-100 text-stone-500 rounded">
                            {src.mode}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>ReflectAI &bull; Protected under Firebase Auth &amp; Cloud Firestore</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-200/50 text-stone-700 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
