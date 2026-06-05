'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { aiApi } from '@/lib/api';
import ChatMessage from '@/components/ai/ChatMessage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col max-w-[80%]">
        <span className="text-xs text-[#8B7355] mb-1 ml-1">GAD</span>
        <div className="bg-[#FDFAF5] text-[#1A1208] rounded-2xl rounded-bl-md p-4">
          <div className="flex items-center gap-1">
            <motion.span
              className="w-2 h-2 bg-[#8B7355] rounded-full inline-block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-2 h-2 bg-[#8B7355] rounded-full inline-block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.span
              className="w-2 h-2 bg-[#8B7355] rounded-full inline-block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatbotWidget() {
  const user = useAuthStore((state) => state.user);
  const isChatOpen = useUiStore((s) => s.isChatOpen);
  const setIsChatOpen = useUiStore((s) => s.setIsChatOpen);

  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  if (!user) {
    return null;
  }

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user' as const, content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Trim conversation history if it exceeds 20 messages
      let historyForApi = updatedMessages;
      if (updatedMessages.length > 20) {
        historyForApi = updatedMessages.slice(4);
        setMessages(historyForApi);
      }

      const response = await aiApi.chat(historyForApi, trimmed);
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-xl bg-[#B8860B] text-white shadow-lg hover:shadow-xl transition-shadow hover:opacity-90 cursor-pointer flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageSquare size={22} />
      </button>

      {/* Chat sheet */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[400px] max-w-[100vw] p-0 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4C5A9] shrink-0">
            <SheetHeader className="p-0">
              <SheetTitle className="text-lg font-semibold text-[#1A1208]">
                GAD Archaeological Assistant
              </SheetTitle>
              <SheetDescription className="sr-only">
                AI-powered archaeological research assistant chat
              </SheetDescription>
            </SheetHeader>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-md hover:bg-[#D4C5A9]/30 transition-colors cursor-pointer text-[#8B7355]"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <ChatMessage
                role="model"
                content="Hello! I'm your archaeological research assistant. Ask me about artifacts, historical periods, ancient civilizations, or anything in the database."
                index={0}
              />
            ) : (
              messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role as 'user' | 'model'}
                  content={msg.content}
                  index={i}
                />
              ))
            )}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-[#D4C5A9] p-4 shrink-0">
            <div className="flex items-center gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about artifacts, history..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#D4C5A9] bg-[#FDFAF5] text-sm text-[#1A1208] placeholder:text-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/50 focus:border-[#B8860B]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-lg bg-[#B8860B] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
