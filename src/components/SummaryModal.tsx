import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Copy,
  Lightbulb,
  CheckCircle2,
  X,
  PlusCircle,
} from 'lucide-react';
import type { GeminiSummaryResponse } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: GeminiSummaryResponse | null;
  onAppendToReflection: (summaryText: string) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  onAppendToReflection,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !summaryData) return null;

  const handleCopy = () => {
    const textToCopy = `### Reflection Summary\n${summaryData.summary}\n\n### Key Insights\n${summaryData.keyInsights.map((i) => `- ${i}`).join('\n')}\n\n### Action Items\n${summaryData.actionItems.map((a) => `- ${a}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedSummaryNote = `**AI Reflection Summary:**\n${summaryData.summary}\n\n**Key Takeaways:**\n${summaryData.keyInsights.map((i) => `• ${i}`).join('\n')}\n\n**Next Steps:**\n${summaryData.actionItems.map((a) => `• ${a}`).join('\n')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Session Synthesis &amp; Key Insights</h2>
              <p className="text-xs text-stone-500">
                Generated via {summaryData.modelUsed || 'Gemini 3.6 Flash'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {/* Executive Overview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Cohesive Summary
            </h3>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm leading-relaxed">
              {summaryData.summary}
            </div>
          </div>

          {/* Key Insights */}
          {summaryData.keyInsights && summaryData.keyInsights.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Uncovered Insights</span>
              </h3>
              <ul className="space-y-2">
                {summaryData.keyInsights.map((insight, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-amber-50/50 border border-amber-100/80 text-xs sm:text-sm text-stone-800 flex items-start space-x-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-normal">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {summaryData.actionItems && summaryData.actionItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recommended Next Steps &amp; Prompts</span>
              </h3>
              <ul className="space-y-2">
                {summaryData.actionItems.map((action, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs sm:text-sm text-stone-800 flex items-start space-x-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      &bull;
                    </span>
                    <span className="leading-normal">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onAppendToReflection(formattedSummaryNote);
                onClose();
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Attach to Reflection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
