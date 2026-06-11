'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  index?: number;
}

export default function ChatMessage({ role, content, index }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {isUser ? (
        /* User message — right-aligned */
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[85%]">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      ) : (
        /* AI message — left-aligned with avatar */
        <div className="flex gap-3 max-w-[85%]">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
