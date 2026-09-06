import React, { useState, useMemo } from 'react';
import type { UserInteraction, InteractionMode } from '../types';
import {
  Clock,
  Search,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  Star,
  X,
  Filter,
  ArrowUpRight,
} from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: UserInteraction[];
  currentInteractionId: string | null;
  onSelectInteraction: (interaction: UserInteraction) => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  loading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  interactions,
  currentInteractionId,
  onSelectInteraction,
  onDeleteInteraction,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.messages.some((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMode = selectedMode === 'all' || item.mode === selectedMode;

      return matchesSearch && matchesMode;
    });
  }, [interactions, searchTerm, selectedMode]);

  if (!isOpen) return null;

  return (
    <aside
      id="history-sidebar"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 md:w-[420px] bg-white border-l border-stone-200 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-stone-700" />
          <h2 className="text-base font-bold text-stone-900">Your Reflection History</h2>
          <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs font-medium">
            {interactions.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          title="Close History"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 border-b border-stone-100 space-y-3 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search entries, keywords, thoughts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white"
          />
        </div>

        {/* Mode filter chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {['all', 'reflection', 'brainstorm', 'gratitude', 'summary'].map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium whitespace-nowrap transition cursor-pointer ${
                selectedMode === mode
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-400 space-y-2">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
            <span className="text-xs">Loading encrypted reflections...</span>
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="py-16 text-center text-stone-400 space-y-3">
            <Clock className="w-10 h-10 mx-auto stroke-[1.5] text-stone-300" />
            <p className="text-sm font-medium text-stone-600">No reflections found</p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              {searchTerm
                ? 'No past entries match your search query.'
                : 'Start a new reflection in the editor. Your entries will be saved isolated to your Firestore profile.'}
            </p>
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = item.id === currentInteractionId;
            const messageCount = item.messages ? item.messages.length : 0;
            const dateStr = item.updatedAt || item.createdAt;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently';

            return (
              <div
                key={item.id}
                id={`history-entry-${item.id}`}
                className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-xs'
                }`}
                onClick={() => {
                  onSelectInteraction(item);
                  // On mobile screens, close sidebar when selected
                  if (window.innerWidth < 640) {
                    onClose();
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-stone-900 line-clamp-1 group-hover:text-stone-800">
                    {item.title || 'Untitled Reflection'}
                  </h3>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this reflection? This cannot be undone.')) {
                          setDeletingId(item.id);
                          await onDeleteInteraction(item.id);
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === item.id}
                      className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-80 group-hover:opacity-100 cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preview text */}
                <p className="text-xs text-stone-500 line-clamp-2 mb-2.5 font-normal leading-relaxed">
                  {item.summary ||
                    (item.messages && item.messages.length > 0
                      ? item.messages[0].content
                      : 'Empty session')}
                </p>

                {/* Metadata footer */}
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-100 pt-2">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-0.5">
                      <MessageSquare className="w-3 h-3" />
                      <span>{messageCount} turns</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-stone-100 text-stone-600">
                      {item.mode}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 flex items-center justify-between">
        <span>Firestore path: /users/{'{uid}'}/interactions</span>
        <span className="text-emerald-700 font-medium flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Syncing Live</span>
        </span>
      </div>
    </aside>
  );
};
