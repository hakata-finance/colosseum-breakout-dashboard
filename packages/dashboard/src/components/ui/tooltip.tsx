'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

export function Tooltip({ 
  content, 
  children, 
  className,
  side = 'top',
  maxWidth = 'max-w-xs'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!content.trim()) return;
    
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = 0;
    let y = 0;

    switch (side) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 8;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 8;
        break;
      case 'left':
        x = rect.left - 8;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 8;
        y = rect.top + rect.height / 2;
        break;
    }

    setPosition({ x, y });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-100',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-100',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-100',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-100'
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn("relative", className)}
      >
        {children}
      </div>
      
      {isVisible && content.trim() && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: position.x,
            top: position.y,
            transform: side === 'top' || side === 'bottom' 
              ? 'translateX(-50%)' 
              : side === 'left' 
                ? 'translateX(-100%)' 
                : 'translateX(0)',
            ...(side === 'left' || side === 'right' ? { 
              transform: 'translateY(-50%)' + (side === 'left' ? ' translateX(-100%)' : '')
            } : {})
          }}
        >
          <div className={cn(
            "relative px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-lg border",
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
    </>
  );
}
