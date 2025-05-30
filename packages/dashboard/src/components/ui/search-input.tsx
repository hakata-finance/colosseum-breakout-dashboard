'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Search, X, Loader2, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearching?: boolean;
  resultCount?: number;
  className?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  isSearching = false,
  resultCount,
  className,
  showClearButton = true,
  autoFocus = false,
  recentSearches = [],
  onRecentSearchSelect
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
    setShowSuggestions(false);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
      } else {
        handleClear();
      }
    } else if (e.key === 'ArrowDown' && recentSearches.length > 0) {
      e.preventDefault();
      setShowSuggestions(true);
    }
  }, [handleClear, showSuggestions, recentSearches.length]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (recentSearches.length > 0 && !value) {
      setShowSuggestions(true);
    }
  }, [recentSearches.length, value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    onRecentSearchSelect?.(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange, onRecentSearchSelect]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          )}
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "pl-10 pr-10 transition-all duration-200",
              isFocused && "ring-2 ring-blue-500/20",
              value && "bg-blue-50/5"
            )}
          />
          
          {value && showClearButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && recentSearches.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent searches
            </div>
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(search)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded flex items-center gap-2"
              >
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
