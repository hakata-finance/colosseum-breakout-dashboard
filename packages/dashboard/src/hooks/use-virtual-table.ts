'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface VirtualItem<T> {
  item: T;
  index: number;
  style: React.CSSProperties;
}

interface UseVirtualTableOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  enabled?: boolean;
}

export function useVirtualTable<T>(
  items: T[],
  options: UseVirtualTableOptions
) {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    enabled = true
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = enabled 
    ? Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    : 0;
  
  const endIndex = enabled 
    ? Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      )
    : items.length;

  const visibleItems: VirtualItem<T>[] = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: enabled ? {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
        left: 0,
      } : {},
    }));
  }, [items, startIndex, endIndex, itemHeight, enabled]);

  const totalHeight = enabled ? items.length * itemHeight : 'auto';

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (enabled) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  }, [enabled]);

  // Reset scroll when items change significantly
  useEffect(() => {
    if (scrollElementRef.current && items.length === 0) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current && enabled) {
      const scrollTo = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTo;
      setScrollTop(scrollTo);
    }
  }, [itemHeight, enabled]);

  const scrollToTop = useCallback(() => {
    scrollToIndex(0);
  }, [scrollToIndex]);

  return {
    visibleItems,
    totalHeight,
    onScroll,
    scrollElementRef,
    scrollToIndex,
    scrollToTop,
    isVirtualized: enabled,
    startIndex,
    endIndex,
    containerProps: enabled ? {
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative' as const,
      },
    } : {
      style: {
        height: 'auto',
        overflow: 'visible',
      },
    },
  };
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    itemCount: 0,
    fps: 0,
  });

  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const framesRef = useRef<number[]>([]);

  const startMeasure = useCallback(() => {
    return performance.now();
  }, []);

  const endMeasure = useCallback((startTime: number, itemCount: number) => {
    const renderTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, renderTime, itemCount }));
  }, []);

  useEffect(() => {
    const measureFPS = () => {
      const now = performance.now();
      
      if (lastTimeRef.current) {
        const delta = now - lastTimeRef.current;
        framesRef.current.push(1000 / delta);
        
        // Keep only last 60 frames
        if (framesRef.current.length > 60) {
          framesRef.current.shift();
        }
        
        // Calculate average FPS
        const avgFPS = framesRef.current.reduce((a, b) => a + b, 0) / framesRef.current.length;
        setMetrics(prev => ({ ...prev, fps: Math.round(avgFPS) }));
      }
      
      lastTimeRef.current = now;
      frameRef.current = requestAnimationFrame(measureFPS);
    };

    frameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { metrics, startMeasure, endMeasure };
}

// Hook for detecting if virtualization should be enabled
export function useVirtualizationThreshold(itemCount: number, threshold: number = 100) {
  return useMemo(() => itemCount > threshold, [itemCount, threshold]);
}
