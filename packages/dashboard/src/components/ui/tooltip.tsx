'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
  delay?: number;
}

export function Tooltip({ 
  content, 
  children, 
  className,
  side = 'top',
  maxWidth = 'max-w-xs',
  delay = 800
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (!content.trim()) return;
    
    setShouldShow(true);
    timeoutRef.current = setTimeout(() => {
      if (shouldShow) {
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    setShouldShow(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldShow) {
      setIsVisible(false);
    }
  }, [shouldShow]);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-800'
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative", className)}
    >
      {children}
      
      {isVisible && content.trim() && (
        <div 
          ref={tooltipRef}
          className={cn(
            "absolute z-50 pointer-events-none",
            sideClasses[side]
          )}
        >
          <div className={cn(
            "relative px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-xl border border-gray-700",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            maxWidth
          )}>
            <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </div>
            {/* Arrow */}
            <div className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[side]
            )} />
          </div>
        </div>
      )}
    </div>
  );
}
