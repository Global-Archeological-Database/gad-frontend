'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, SendHorizonal, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { aiApi } from '@/lib/api';
import ChatMessage from '@/components/ai/ChatMessage';

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
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
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
      <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
        <p className="text-sm text-foreground leading-relaxed">
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
   Chatbot Widget
   ──────────────────────────────────────────── */
export default function ChatbotWidget() {
  const pathname = usePathname();
  const isChatOpen = useUiStore((s) => s.isChatOpen);
  const setIsChatOpen = useUiStore((s) => s.setIsChatOpen);
  const isSubmitFormOpen = useUiStore((s) => s.isSubmitFormOpen);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

        const response = await aiApi.chat(convertedHistory, content);
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: response.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content:
              'I apologize, but I encountered an error processing your request. Please try again.',
            failed: true,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages],
  );

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
      If Submit FAB is open, offset the trigger button to the left.
      The panel always positions relative to the trigger. */
  const triggerPosition = isSubmitFormOpen
    ? 'bottom-24 right-6'
    : 'bottom-6 right-6';

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-40
                       w-[min(380px,calc(100vw-24px))]
                       h-[min(560px,calc(100vh-120px))]
                       rounded-2xl bg-background border border-secondary/50
                       shadow-warm-2xl overflow-hidden flex flex-col"
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3
                          border-b border-secondary/40 bg-muted/20"
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
                  <h3 className="font-display font-semibold text-sm text-foreground">
                    Archaeological Assistant
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Powered by Gemini AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Clear chat button */}
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-muted-foreground
                               hover:text-foreground hover:bg-muted
                               transition-colors duration-150"
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
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {/* Welcome message — always first */}
              <WelcomeMessage />

              {/* Quick action chips — hide after first user message */}
              {messages.length === 0 && (
                <QuickActions onSelect={sendMessage} />
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

            {/* ── Input Area ── */}
            <div className="border-t border-secondary/40 p-3">
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
                               bg-muted/30 px-3.5 py-2.5 text-sm
                               placeholder:text-muted-foreground
                               focus:border-primary/40 focus:bg-background
                               focus:ring-2 focus:ring-primary/15
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
                      : 'bg-muted text-muted-foreground cursor-not-allowed',
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
