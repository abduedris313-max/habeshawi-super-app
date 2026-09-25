/**
 * @file VoiceConversationHistory.tsx
 * @description Conversation History and Saved Sessions for Habeshawi Voice Live.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Trash2, 
  Clock, 
  Volume2, 
  Copy, 
  Check, 
  Share2, 
  Sparkles,
  User,
  Bot
} from 'lucide-react';
import { VoiceSession } from '../types';
import { triggerHaptic } from '../../../utils/haptics';

interface VoiceConversationHistoryProps {
  sessions: VoiceSession[];
  onClearHistory: () => void;
  onSelectSession?: (session: VoiceSession) => void;
}

export const VoiceConversationHistory: React.FC<VoiceConversationHistoryProps> = ({
  sessions,
  onClearHistory,
  onSelectSession,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyTranscript = (session: VoiceSession) => {
    const text = session.turns
      .map((t) => `${t.sender === 'user' ? 'User' : 'Gemini'}: ${t.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedId(session.id);
    triggerHaptic('selection');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-neutral-400">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
          <MessageSquare className="w-8 h-8 text-neutral-500" />
        </div>
        <h4 className="text-sm font-semibold text-neutral-300">No Voice Sessions Yet</h4>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          Your two-way live voice conversations with Gemini 3.8 Live will be automatically transcribed and saved here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Recent Voice Dialogues ({sessions.length})
        </span>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md space-y-3"
          >
            {/* Session Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Volume2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">{session.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.createdAt}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-cyan-400">{session.voiceName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCopyTranscript(session)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="Copy Transcript"
              >
                {copiedId === session.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Conversation Turn Bubbles */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/80 max-h-48 overflow-y-auto pr-1">
              {session.turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex gap-2 text-xs ${
                    turn.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {turn.sender === 'gemini' && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      turn.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700/60 rounded-bl-none'
                    }`}
                  >
                    {turn.text}
                  </div>

                  {turn.sender === 'user' && (
                    <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-neutral-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
