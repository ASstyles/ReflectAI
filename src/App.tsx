import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { JournalEditor } from './components/JournalEditor';
import { HistorySidebar } from './components/HistorySidebar';
import { SecurityModal } from './components/SecurityModal';
import { AskJournalModal } from './components/AskJournalModal';
import {
  saveInteraction,
  deleteInteraction,
  subscribeUserInteractions,
} from './lib/firebase';
import type { UserInteraction, InteractionMode } from './types';
import { Sparkles } from 'lucide-react';

function createFreshInteraction(userId: string): UserInteraction {
  return {
    id: `interaction_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title: 'New Reflection',
    mode: 'reflection',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAskJournalOpen, setIsAskJournalOpen] = useState(false);

  const [currentInteraction, setCurrentInteraction] = useState<UserInteraction>(() =>
    createFreshInteraction(user?.uid || 'anonymous')
  );

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep track of current interaction in ref for realtime updates
  const currentInteractionRef = useRef(currentInteraction);
  currentInteractionRef.current = currentInteraction;

  // Realtime Firestore Subscription for isolated user data
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingHistory(true);
    const unsubscribe = subscribeUserInteractions(
      user.uid,
      (fetchedInteractions) => {
        setInteractions(fetchedInteractions);
        setLoadingHistory(false);

        // If the current interaction exists in the fetched list and has more recent updates,
        // sync if appropriate
        const active = currentInteractionRef.current;
        const matching = fetchedInteractions.find((item) => item.id === active.id);
        if (matching && matching.messages.length > active.messages.length) {
          setCurrentInteraction(matching);
        }
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setLoadingHistory(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Persist interaction to Firestore
  const handleSaveInteraction = useCallback(
    async (interactionToSave: UserInteraction) => {
      if (!user?.uid) return;
      setSaveStatus('saving');
      setSaveError(null);

      try {
        await saveInteraction(user.uid, interactionToSave);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err: any) {
        console.error('Error saving interaction to Firestore:', err);
        setSaveStatus('error');
        setSaveError(err?.message || 'Failed to save to Firestore. Please retry.');
        throw err;
      }
    },
    [user?.uid]
  );

  // Start a new reflection
  const handleNewEntry = useCallback(() => {
    if (!user?.uid) return;
    const fresh = createFreshInteraction(user.uid);
    setCurrentInteraction(fresh);
    setSaveStatus('idle');
    setSaveError(null);
  }, [user?.uid]);

  // Select an interaction from history
  const handleSelectInteraction = useCallback((selected: UserInteraction) => {
    setCurrentInteraction(selected);
    setSaveStatus('idle');
    setSaveError(null);
  }, []);

  // Delete an interaction
  const handleDeleteInteraction = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await deleteInteraction(user.uid, id);
        // If the currently open interaction was deleted, reset to new
        if (currentInteraction.id === id) {
          handleNewEntry();
        }
      } catch (err: any) {
        console.error('Delete error:', err);
        alert(`Failed to delete reflection: ${err?.message}`);
      }
    },
    [user?.uid, currentInteraction.id, handleNewEntry]
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navbar */}
      <Navbar
        onNewEntry={handleNewEntry}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        isHistoryOpen={isHistoryOpen}
        historyCount={interactions.length}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenAskJournal={() => setIsAskJournalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <JournalEditor
          currentInteraction={currentInteraction}
          onUpdateInteraction={setCurrentInteraction}
          onSaveInteraction={handleSaveInteraction}
          saveStatus={saveStatus}
          saveError={saveError}
          onRetrySave={() => handleSaveInteraction(currentInteraction)}
        />

        {/* History Sidebar */}
        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          interactions={interactions}
          currentInteractionId={currentInteraction.id}
          onSelectInteraction={handleSelectInteraction}
          onDeleteInteraction={handleDeleteInteraction}
          loading={loadingHistory}
        />
      </main>

      {/* Ask My Journal Modal */}
      <AskJournalModal
        isOpen={isAskJournalOpen}
        onClose={() => setIsAskJournalOpen(false)}
      />

      {/* Security Info Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        userId={user?.uid}
      />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-stone-600 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-md animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium tracking-tight">Loading your reflection sanctuary...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
