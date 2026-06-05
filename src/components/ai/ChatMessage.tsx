'use client';

import { motion } from 'framer-motion';

interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  index?: number;
}

export default function ChatMessage({ role, content, index }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      layoutId={index !== undefined ? `chat-message-${index}` : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="flex flex-col max-w-[80%]">
        {!isUser && (
          <span className="text-xs text-[#8B7355] mb-1 ml-1">GAD</span>
        )}
        <div
          className={`p-3 whitespace-pre-wrap ${
            isUser
              ? 'bg-[#B8860B] text-[#FFFFFF] rounded-2xl rounded-br-md'
              : 'bg-[#FDFAF5] text-[#1A1208] rounded-2xl rounded-bl-md'
          }`}
        >
          {content}
        </div>
      </div>
    </motion.div>
  );
}
