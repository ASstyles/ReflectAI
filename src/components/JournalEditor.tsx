import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RefreshCw,
  Save,
  Download,
  Lightbulb,
  Check,
  AlertCircle,
  Clock,
  Compass,
  Smile,
  BookOpen,
  Copy,
  Tag,
  Share2,
} from 'lucide-react';
import type { UserInteraction, InteractionMessage, InteractionMode, GeminiSummaryResponse } from '../types';
import { SummaryModal } from './SummaryModal';
import { auth } from '../lib/firebase';

interface JournalEditorProps {
  currentInteraction: UserInteraction;
  onUpdateInteraction: (interaction: UserInteraction) => void;
  onSaveInteraction: (interaction: UserInteraction) => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  onRetrySave: () => void;
}

const PROMPT_STARTERS: Record<InteractionMode, string[]> = {
  reflection: [
    'I made a tough decision today and I want to reflect on whether I handled it well...',
    'I’ve been feeling a bit overwhelmed by my current responsibilities. Let’s unpack why...',
    'What did today teach me about my personal boundaries and priorities?',
  ],
  brainstorm: [
    'I want to brainstorm 5 novel approaches to solve this stubborn challenge...',
    'Help me map out the pros and cons of pivoting my current project trajectory...',
    'What unexpected creative angles could I explore for my next milestone?',
  ],
  gratitude: [
    'Three small, meaningful moments that brought me peace today were...',
    'Who is someone who supported me recently, and how can I express genuine appreciation?',
    'What is an obstacle I overcame this week that I can now look back on with gratitude?',
  ],
  summary: [
    'Synthesize the common patterns across what I have been pondering recently...',
    'Summarize my main takeaways from this week into 3 clear guiding principles...',
  ],
  general: [
    'Here is an unedited stream of consciousness about what is on my mind right now...',
    'I need an objective sounding board for a thought I cannot easily shake...',
  ],
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  currentInteraction,
  onUpdateInteraction,
  onSaveInteraction,
  saveStatus,
  saveError,
  onRetrySave,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState<GeminiSummaryResponse | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentInteraction.messages, isGenerating]);

  // Handle Mode Change
  const handleModeChange = (newMode: InteractionMode) => {
    onUpdateInteraction({
      ...currentInteraction,
      mode: newMode,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle Title Change
  const handleTitleChange = (newTitle: string) => {
    onUpdateInteraction({
      ...currentInteraction,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  // Submit Prompt to Gemini API and persist to Firestore
  const handleSubmitPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedPrompt = inputPrompt.trim();
    if (!trimmedPrompt || isGenerating) return;

    setApiError(null);
    const userMessageId = `msg-user-${Date.now()}`;
    const newUserMessage: InteractionMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    };

    // Optimistically prepare the updated conversation
    const updatedMessages = [...currentInteraction.messages, newUserMessage];
    const interactionWithUserMsg: UserInteraction = {
      ...currentInteraction,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    // Keep the input text in state until the entire transaction succeeds!
    // (Adhering to Guaranteed Transaction Verification & Defensive hygiene)
    setIsGenerating(true);

    try {
      // Retrieve fresh Firebase ID token for secure backend authentication
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      // 1. Call server-side Gemini endpoint
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: trimmedPrompt,
          history: currentInteraction.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mode: currentInteraction.mode,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const modelMessageId = `msg-model-${Date.now()}`;
      const newModelMessage: InteractionMessage = {
        id: modelMessageId,
        role: 'model',
        content: data.response || 'No response generated.',
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const finalMessages = [...updatedMessages, newModelMessage];
      const updatedInteraction: UserInteraction = {
        ...interactionWithUserMsg,
        title:
          currentInteraction.title === 'New Reflection' && data.suggestedTitle
            ? data.suggestedTitle
            : currentInteraction.title,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      // 2. Guaranteed Persistence to Firestore
      await onSaveInteraction(updatedInteraction);
      onUpdateInteraction(updatedInteraction);

      // Only clear input prompt once save is confirmed!
      setInputPrompt('');
    } catch (err: any) {
      console.error('Gemini reflection error:', err);
      setApiError(err?.message || 'Failed to generate AI response. Your draft is preserved below.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Session Summary & Key Insights
  const handleGenerateSummary = async () => {
    if (currentInteraction.messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    setApiError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: currentInteraction.messages,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server returned error status ${response.status}`);
      }

      const data: GeminiSummaryResponse = await response.json();
      setSummaryData(data);
      setIsSummaryModalOpen(true);

      // Also attach summary to current interaction and save
      const updatedWithSummary: UserInteraction = {
        ...currentInteraction,
        summary: data.summary,
        keyInsights: data.keyInsights,
        actionItems: data.actionItems,
        updatedAt: new Date().toISOString(),
      };
      await onSaveInteraction(updatedWithSummary);
      onUpdateInteraction(updatedWithSummary);
    } catch (err: any) {
      console.error('Summary error:', err);
      setApiError(err?.message || 'Failed to synthesize summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Append summary text to reflection messages
  const handleAppendSummary = async (summaryText: string) => {
    const summaryMsg: InteractionMessage = {
      id: `msg-summary-${Date.now()}`,
      role: 'model',
      content: summaryText,
      timestamp: new Date().toISOString(),
      modelUsed: summaryData?.modelUsed || 'gemini-3.6-flash',
    };

    const updated: UserInteraction = {
      ...currentInteraction,
      messages: [...currentInteraction.messages, summaryMsg],
      updatedAt: new Date().toISOString(),
    };
    await onSaveInteraction(updated);
    onUpdateInteraction(updated);
  };

  // Export current session as Markdown
  const handleExportMarkdown = () => {
    let md = `# ${currentInteraction.title}\n\n`;
    md += `*Category: ${currentInteraction.mode} | Date: ${new Date(currentInteraction.createdAt).toLocaleString()}*\n\n`;
    if (currentInteraction.summary) {
      md += `> **Summary**: ${currentInteraction.summary}\n\n`;
    }
    md += `---\n\n`;
    currentInteraction.messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'Me' : 'Gemini'}\n*${new Date(m.timestamp).toLocaleTimeString()}*\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentInteraction.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy individual message
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-4 sm:px-6 py-4">
      {/* Top Session Metadata Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Editable Title */}
          <div className="flex-1">
            <input
              id="reflection-title-input"
              type="text"
              value={currentInteraction.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title your reflection..."
              className="w-full text-lg sm:text-xl font-serif font-bold text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-stone-500 focus:outline-none transition py-0.5"
            />
          </div>

          {/* Action buttons: Save status, Summary button, Export */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Persistence Status Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border">
              {saveStatus === 'saving' && (
                <span className="flex items-center space-x-1 text-amber-700 bg-amber-50 border-amber-200">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Saving to Firestore...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center space-x-1 text-emerald-700">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <button
                  onClick={onRetrySave}
                  className="flex items-center space-x-1 text-rose-700 hover:text-rose-900 font-semibold underline cursor-pointer"
                >
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  <span>Retry Save</span>
                </button>
              )}
              {saveStatus === 'idle' && (
                <span className="flex items-center space-x-1 text-stone-500">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Synced</span>
                </span>
              )}
            </div>

            {/* Summarize Button */}
            {currentInteraction.messages.length > 0 && (
              <button
                id="generate-summary-btn"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                title="Synthesize conversation into key insights"
              >
                {isSummarizing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-800" />
                )}
                <span>Summarize</span>
              </button>
            )}

            {/* Export Markdown */}
            <button
              id="export-markdown-btn"
              onClick={handleExportMarkdown}
              className="p-1.5 rounded-md border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 text-xs transition cursor-pointer"
              title="Export as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs pt-1 border-t border-stone-100">
          <span className="text-stone-400 font-medium text-[11px] uppercase tracking-wider mr-1">
            Focus:
          </span>
          {[
            { mode: 'reflection', label: 'Self Reflection', icon: Compass },
            { mode: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
            { mode: 'gratitude', label: 'Gratitude', icon: Smile },
            { mode: 'summary', label: 'Synthesis', icon: BookOpen },
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode as InteractionMode)}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                currentInteraction.mode === mode
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Error Alert Banner */}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Database write failed: {saveError}</span>
          </div>
          <button
            onClick={onRetrySave}
            className="px-2.5 py-1 rounded bg-rose-700 text-white font-medium hover:bg-rose-800 transition cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-amber-800 font-bold hover:text-amber-950 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
        {currentInteraction.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100/70 text-amber-900 flex items-center justify-center shadow-xs">
              <Compass className="w-7 h-7 stroke-[1.5]" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Begin your reflection
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
                Share a thought, dilemma, win, or unresolved feeling. Gemini will act as your empathetic thinking partner.
              </p>
            </div>

            {/* Prompt Starter Buttons */}
            <div className="w-full max-w-lg space-y-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
                Suggested Starters
              </span>
              {PROMPT_STARTERS[currentInteraction.mode].map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputPrompt(starter)}
                  className="w-full text-left p-3 rounded-xl bg-white border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 text-xs text-stone-700 hover:text-stone-900 transition-all shadow-2xs group flex items-start justify-between cursor-pointer"
                >
                  <span className="line-clamp-2 leading-relaxed">&ldquo;{starter}&rdquo;</span>
                  <Sparkles className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 shrink-0 ml-2 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentInteraction.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 text-left ${
                  isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-2xs ${
                    isUser
                      ? 'bg-stone-900 text-white'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 transition-all ${
                    isUser
                      ? 'bg-stone-900 text-stone-100 rounded-tr-xs'
                      : 'bg-white border border-stone-200/90 text-stone-900 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {/* Role and Model Badge */}
                  <div
                    className={`flex items-center justify-between text-[10px] font-medium mb-1.5 pb-1 border-b ${
                      isUser ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-400'
                    }`}
                  >
                    <span>{isUser ? 'You' : 'Gemini 3.6 Flash'}</span>
                    <div className="flex items-center space-x-2">
                      <span>{formattedTime}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition hover:text-stone-600"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Markdown or plain text content */}
                  <div
                    className={`text-xs sm:text-sm leading-relaxed prose prose-stone max-w-none ${
                      isUser ? 'text-stone-100' : 'text-stone-800'
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Generating Indicator */}
        {isGenerating && (
          <div className="flex items-start space-x-3 text-left">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-4 shadow-2xs flex items-center space-x-3 text-xs text-stone-500">
              <div className="w-4 h-4 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
              <span>Gemini is reflecting on your thoughts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <form
        onSubmit={handleSubmitPrompt}
        className="bg-white rounded-2xl border border-stone-200 p-3 shadow-sm focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 transition"
      >
        <div className="relative flex items-end">
          <textarea
            id="reflection-input-field"
            ref={textareaRef}
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitPrompt();
              }
            }}
            placeholder="Write your journal entry or question for Gemini... (Enter to send, Shift+Enter for new line)"
            className="w-full resize-none pr-12 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent max-h-36 overflow-y-auto leading-relaxed"
          />

          <button
            id="submit-prompt-btn"
            type="submit"
            disabled={!inputPrompt.trim() || isGenerating}
            className="absolute right-1 bottom-1 p-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white transition cursor-pointer shadow-xs"
            title="Send to Gemini"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <Send className="w-4 h-4 text-amber-300" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 mt-1 border-t border-stone-100">
          <div className="flex items-center space-x-2">
            <span>Press Enter to send</span>
            <span>&bull;</span>
            <span>All turns saved to your isolated Firestore</span>
          </div>
          <span>{inputPrompt.length}/10,000</span>
        </div>
      </form>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
        onAppendToReflection={handleAppendSummary}
      />
    </div>
  );
};
