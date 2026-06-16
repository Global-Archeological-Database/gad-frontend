'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, SendHorizonal, Trash2, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { aiApi } from '@/lib/api';
import ChatMessage from '@/components/ai/ChatMessage';
import { formatAIResponse } from '@/lib/formatAIResponse';

/* ────────────────────────────────────────────
   useMediaQuery Hook
   ──────────────────────────────────────────── */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */
interface Message {
  role: 'user' | 'model';
  content: string;
  failed?: boolean;
}

/* ────────────────────────────────────────────
   Typing Indicator
   ──────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 border border-secondary/30">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Welcome Message
   ──────────────────────────────────────────── */
function WelcomeMessage() {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="bg-card rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] border border-secondary/30">
        <p className="text-sm text-card-foreground leading-relaxed">
          Welcome! I'm your archaeological research assistant. I can help you
          understand artifacts, historical periods, ancient civilizations, and
          archaeological methods. What would you like to explore?
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Quick Action Chips
   ──────────────────────────────────────────── */
const QUICK_ACTIONS = [
  'Bronze Age artifacts',
  'Dating techniques',
  'Roman civilization',
  'Pottery identification',
];

function QuickActions({ onSelect }: { onSelect: (action: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 ml-9">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          className="text-[11px] px-2.5 py-1 rounded-full border border-secondary
                     text-muted-foreground hover:border-primary/40
                     hover:text-primary hover:bg-primary/5
                     transition-all duration-200"
        >
          {action}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Response Mode Configuration
   ──────────────────────────────────────────── */
const RESPONSE_MODES = [
  { id: 'concise', label: 'Brief', description: 'Short, direct answers' },
  { id: 'standard', label: 'Normal', description: 'Balanced explanation' },
  { id: 'detailed', label: 'Detailed', description: 'Thorough academic explanation' },
  { id: 'report', label: 'Report', description: 'Structured report format' },
] as const;

type ResponseMode = typeof RESPONSE_MODES[number]['id'];

const getModeInstruction = (mode: ResponseMode): string => {
  switch (mode) {
    case 'concise':
      return 'Respond in 2-4 sentences maximum. Be direct and precise.';
    case 'standard':
      return 'Respond in clear paragraphs. Cover the key points without unnecessary detail.';
    case 'detailed':
      return 'Provide a comprehensive explanation with context, examples, and scholarly detail. Use clear paragraphs.';
    case 'report':
      return 'Structure your response as a brief report with clear section headings (plain text, no markdown symbols). Include: Overview, Key Facts, Significance, and Further Reading suggestions.';
    default:
      return '';
  }
};

/* ── Animation variants ── */
const panelVariants = {
  collapsed: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  default: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  expanded: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

/* ────────────────────────────────────────────
   Chatbot Widget
   ──────────────────────────────────────────── */
export default function ChatbotWidget() {
  const pathname = usePathname();
  const isChatOpen = useUiStore((s) => s.isChatOpen);
  const setIsChatOpen = useUiStore((s) => s.setIsChatOpen);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>('standard');
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ── Auto-scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Close chat on navigation ── */
  useEffect(() => {
    setIsChatOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ── Focus input when chat opens ── */
  useEffect(() => {
    if (isChatOpen) {
      // Small delay so the panel animation doesn't fight the focus
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  /* ── Escape key closes chat ── */
  useEffect(() => {
    if (!isChatOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsChatOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isChatOpen, setIsChatOpen]);

  /* ── Send message ── */
  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isTyping) return;

      const userMessage: Message = { role: 'user', content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setIsTyping(true);

      try {
        const convertedHistory = updatedMessages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));

        // Prepend mode instruction for the AI
        const modeInstruction = getModeInstruction(responseMode);
        const augmentedContent = modeInstruction
          ? `[Format: ${modeInstruction}]\n\n${content}`
          : content;

        const response = await aiApi.chat(convertedHistory, augmentedContent);
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: formatAIResponse(response.reply) },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: formatAIResponse('⚠ I encountered an issue. Please try your question again.'),
            failed: true,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages, responseMode],
  );

  /* ── Quick action handler with typing guard ── */
  const handleQuickAction = useCallback(async (text: string) => {
    if (isTyping) return;
    await sendMessage(text);
  }, [isTyping, sendMessage]);

  /* ── Clear conversation ── */
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  /* ── Input change handler with auto-resize ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setInput(value);
    }
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  };

  /* ── Key handlers ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Position logic ──
      The panel always positions relative to the trigger. */
  const triggerPosition = 'bottom-6 right-6';

  /* ── Render ── */
  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? 'Close chat' : 'Open archaeological assistant'}
        className={[
          'fixed z-50 w-14 h-14 rounded-full',
          'flex items-center justify-center',
          'bg-gradient-to-br from-[#C4971A] to-[#8B6914]',
          'shadow-warm-xl hover:shadow-golden',
          'transition-all duration-300',
          'hover:scale-110 active:scale-95',
          isChatOpen ? 'rotate-0' : 'animate-pulse-golden',
          triggerPosition,
        ].join(' ')}
      >
        {isChatOpen ? (
          <motion.div
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-5 w-5 text-white" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            key="chat-panel"
            initial="collapsed"
            animate={isExpanded && !isMobile ? 'expanded' : 'default'}
            exit="collapsed"
            variants={panelVariants}
            className={[
              "z-40 bg-background border border-secondary/50 shadow-warm-2xl",
              "overflow-hidden flex flex-col",
              isMobile
                ? "fixed inset-0 rounded-none border-0"
                : "fixed bottom-24 right-6 rounded-2xl",
              // Size classes — animated via framer-motion
              isExpanded && !isMobile
                ? "w-[min(600px,calc(100dvw-24px))] h-[min(700px,calc(100dvh-120px))]"
                : "w-[min(380px,calc(100dvw-24px))] h-[min(560px,calc(100dvh-120px))]",
            ].filter(Boolean).join(' ')}
            style={
              {
                // Use CSS custom properties so framer-motion can animate width/height smoothly
                '--panel-width': isExpanded && !isMobile
                  ? 'min(600px,calc(100dvw - 24px))'
                  : 'min(380px,calc(100dvw - 24px))',
                '--panel-height': isExpanded && !isMobile
                  ? 'min(700px,calc(100dvh - 120px))'
                  : 'min(560px,calc(100dvh - 120px))',
              } as React.CSSProperties
            }
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3
                          border-b border-secondary/40 bg-card"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br
                              from-[#C4971A] to-[#8B6914]
                              flex items-center justify-center"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-card-foreground">
                    Archaeological Assistant
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Powered by Gemini AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Back button (mobile only) */}
                {isMobile && (
                  <button onClick={() => setIsChatOpen(false)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2.5"
                    aria-label="Back">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                )}
                {/* Expand / collapse button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Compact view" : "Expand panel"}
                  className="w-9 h-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 flex items-center justify-center"
                  aria-label={isExpanded ? "Compact view" : "Expand panel"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Clear chat button */}
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    className="w-9 h-9 p-0 rounded-lg text-muted-foreground
                               hover:text-foreground hover:bg-secondary
                               transition-colors duration-150 flex items-center justify-center"
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Message List ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-background"
            >
              {/* Welcome message — always first */}
              <WelcomeMessage />

              {/* Quick action chips — hide after first user message */}
              {messages.length === 0 && (
                <QuickActions onSelect={handleQuickAction} />
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  index={idx}
                />
              ))}

              {/* Typing indicator */}
              {isTyping && <TypingIndicator />}

              {/* Scroll anchor */}
              <div ref={bottomRef} />
            </div>

            {/* ── Response Mode Selector ── */}
            <div className="px-3 py-2 border-t border-secondary/40 bg-card">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-muted-foreground shrink-0 mr-1">
                  Style:
                </span>
                {RESPONSE_MODES.map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setResponseMode(mode.id)}
                    title={mode.description}
                    className={[
                      "px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0",
                      "transition-all duration-150",
                      responseMode === mode.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    ].join(' ')}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── AI Disclaimer ── */}
            <div className="px-3 py-1.5 bg-card border-t border-secondary/40">
              <p className="text-[10px] text-muted-foreground text-center">
                AI responses may contain inaccuracies. Verify information with
                peer-reviewed sources for academic use.
              </p>
            </div>

            {/* ── Input Area ── */}
            <div className="border-t border-secondary/40 p-3 bg-card">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about archaeological history..."
                    rows={1}
                    className="w-full resize-none rounded-xl border border-secondary/60
                               bg-background px-3.5 py-2.5 text-sm text-foreground
                               placeholder:text-muted-foreground/60
                               focus:border-primary/50 focus:bg-background
                               focus:ring-2 focus:ring-primary/20
                               transition-all duration-200
                               max-h-32 overflow-y-auto"
                    style={{ minHeight: '40px' }}
                  />
                  {input.length > 1800 && (
                    <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                      {input.length}/2000
                    </span>
                  )}
                </div>

                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                  className={[
                    'h-10 w-10 rounded-xl flex items-center justify-center',
                    'transition-all duration-200',
                    input.trim() && !isTyping
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-golden-sm'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed',
                  ].join(' ')}
                >
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Enter to send &middot; Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
