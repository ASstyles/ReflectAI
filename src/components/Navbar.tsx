import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  PlusCircle,
  Clock,
  LogOut,
  Shield,
  User as UserIcon,
  Brain,
} from 'lucide-react';

interface NavbarProps {
  onNewEntry: () => void;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  historyCount: number;
  onOpenSecurityModal: () => void;
  onOpenAskJournal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewEntry,
  onToggleHistory,
  isHistoryOpen,
  historyCount,
  onOpenSecurityModal,
  onOpenAskJournal,
}) => {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewEntry}
            className="flex items-center space-x-2 text-left group focus:outline-none"
            title="Start New Reflection"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-lg font-bold text-stone-900 tracking-tight block leading-none">
                ReflectAI
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                Gemini 3.6 Flash &bull; Firestore
              </span>
            </div>
          </button>
        </div>

        {/* Center Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="nav-new-entry-btn"
            onClick={onNewEntry}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>New Reflection</span>
          </button>

          <button
            id="nav-ask-journal-btn"
            onClick={onOpenAskJournal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-300/80 bg-amber-50 hover:bg-amber-100/80 text-amber-950 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer"
            title="Ask questions about your previous reflections, goals, and themes"
          >
            <Brain className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Ask My Journal</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={onToggleHistory}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition cursor-pointer ${
              isHistoryOpen
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Clock className="w-4 h-4 text-stone-500" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                {historyCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Side: Security info + User profile + Sign Out */}
        <div className="flex items-center space-x-3">
          <button
            id="nav-security-info-btn"
            onClick={onOpenSecurityModal}
            className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-medium transition cursor-pointer"
            title="View Security & Isolation Architecture"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Isolation Rules</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-stone-300 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-semibold text-xs">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="hidden lg:block text-left max-w-[140px] truncate">
              <p className="text-xs font-semibold text-stone-900 truncate">
                {user?.displayName || 'Reflector'}
              </p>
              <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
            </div>

            <button
              id="nav-sign-out-btn"
              onClick={signOut}
              title="Sign Out"
              className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
