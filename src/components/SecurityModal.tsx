import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Database,
  Cpu,
  CheckCircle,
  X,
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Security &amp; Isolation Architecture
              </h2>
              <p className="text-xs text-stone-500">
                Adhering to OWASP Top 10 &amp; Least Privilege Principles
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
        <div className="p-6 overflow-y-auto space-y-4 text-left text-xs sm:text-sm text-stone-700">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>User Scoped Isolation Path</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-mono">
              /databases/(default)/documents/users/{userId || '{user.uid}'}/interactions
            </p>
            <p className="text-[11px] text-emerald-800">
              Only requests containing a verified JWT matching your exact UID can read, write, or query this collection. Other users receive permission denied.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 text-xs">Hardened Firestore Security Rules</h4>
                <pre className="mt-1 p-2.5 rounded-lg bg-stone-900 text-amber-200 text-[11px] font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}`}
                </pre>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 text-xs">Zero-Exposed API Keys</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  The <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-[11px]">GEMINI_API_KEY</code> is never shipped to the browser bundle. All AI generation calls are authenticated and proxied through backend server endpoints.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Cpu className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 text-xs">Model Resilience &amp; Fallback Chain</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Requests automatically cascade through <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-[11px]">gemini-3.6-flash</code> &rarr; <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-[11px]">gemini-3.1-flash-lite</code> &rarr; <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-[11px]">gemini-flash-latest</code> &rarr; <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-[11px]">gemini-3.7-flash</code> to prevent service outages.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 text-xs">Strict Undefined-Stripping Hygiene</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  All payloads sent to Firestore are sanitized with recursive undefined-stripping to eliminate driver serialization faults.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
