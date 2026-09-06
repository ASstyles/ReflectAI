import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Compass,
  Lightbulb,
  FileText,
  ArrowRight,
  Database,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signIn, loading, error, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <header className="w-full border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900">ReflectAI</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-medium">
                Gemini 3.6 Flash
              </span>
            </div>
          </div>

          <button
            id="header-sign-in-btn"
            onClick={signIn}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer"
          >
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Privacy Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-8">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict User-Isolated Cloud Firestore Storage &bull; End-to-End Private</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight text-stone-900 mb-6 leading-tight">
            Your Private Thinking Sanctuary, <br className="hidden sm:inline" />
            Amplified by Gemini.
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Reflect, journal, brainstorm, and unpack complex decisions with an intelligent companion.
            All interactions are cryptographically scoped strictly to your account.
          </p>

          {/* Sign In Alert Banner if Error */}
          {error && (
            <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between text-left">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-3 text-rose-500 hover:text-rose-700 font-bold text-base"
              >
                &times;
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              id="hero-google-signin-button"
              onClick={signIn}
              disabled={loading}
              className="w-full sm:w-auto min-w-[260px] inline-flex items-center justify-center space-x-3 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-medium text-base px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-400 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Three Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">Deep Reflection Dialogs</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Converse multi-turn with Gemini to unpack mental knots, test ideas, or navigate career and personal decisions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center mb-4">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">Instant Synthesis &amp; Insights</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Extract core themes, emotional nuances, and clear action items automatically from any conversation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-2">Guaranteed User Isolation</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Enforced by Firestore security rules. Your reflections are strictly stored at your own user path with zero cross-user access.
              </p>
            </div>
          </div>

          {/* Architecture Trust Highlights */}
          <div className="mt-12 pt-8 border-t border-stone-200 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-stone-700" />
              <span>Firebase Auth Federated Identity</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-stone-700" />
              <span>Isolated Cloud Firestore Documents</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-stone-700" />
              <span>Zero Hardcoded Secrets &bull; Server Proxied</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-stone-700" />
              <span>Resilient Model Fallback Ladder</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>&copy; {new Date().getFullYear()} ReflectAI. Powered by Google AI Studio, Gemini 3.6 Flash &amp; Firestore.</p>
          <div className="flex items-center space-x-4">
            <span>Client-Server Separation</span>
            <span>&bull;</span>
            <span>Owner-Bound Security Rules</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
