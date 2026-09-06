export type InteractionMode = 'reflection' | 'brainstorm' | 'gratitude' | 'summary' | 'general';

export interface InteractionMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface UserInteraction {
  id: string;
  userId: string;
  title: string;
  mode: InteractionMode;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  messages: InteractionMessage[];
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  isFavorite?: boolean;
}

export interface GeminiReflectResponse {
  response: string;
  modelUsed: string;
  suggestedTitle?: string;
}

export interface GeminiSummaryResponse {
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  modelUsed: string;
}

export interface JournalSourceReference {
  id: string;
  title: string;
  date?: string;
  mode?: string;
}

export interface AskJournalResponse {
  answer: string;
  modelUsed: string;
  sources: JournalSourceReference[];
  hasJournalData: boolean;
}
