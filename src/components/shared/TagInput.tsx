'use client';

import { useState, type KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  suggestions?: string[];
}

const WARM_CHIP_COLORS = [
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-stone-100 text-stone-800 border-stone-200',
];

function getChipColor(index: number): string {
  return WARM_CHIP_COLORS[index % WARM_CHIP_COLORS.length];
}

export default function TagInput({
  value,
  onChange,
  placeholder = 'Add a tag...',
  maxTags = 20,
  className,
  suggestions,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.length >= maxTags) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const remaining = maxTags - value.length;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              getChipColor(i)
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-black/10 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length < maxTags ? placeholder : ''}
          disabled={value.length >= maxTags}
          className="min-w-[80px] flex-1 border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        {value.length >= maxTags && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Max {maxTags} tags
          </span>
        )}
      </div>

      {/* Suggested chips */}
      {suggestions && suggestions.length > 0 && remaining > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => {
            const isAdded = value.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                disabled={isAdded}
                onClick={() => {
                  addTag(suggestion);
                  setInputValue('');
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                  isAdded
                    ? 'border-primary/30 bg-primary/5 text-primary/50 cursor-not-allowed'
                    : 'border-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 cursor-pointer'
                )}
              >
                <Plus size={10} />
                {suggestion}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
