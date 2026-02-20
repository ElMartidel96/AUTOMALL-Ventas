/**
 * Performance optimized components
 * Lazy loading and memoization for heavy components
 */

'use client';

import React, { memo, lazy, Suspense, useState, useCallback, useMemo } from 'react';
import { LoadingSkeleton, LoadingCard } from './loading';

// Lazy load heavy components
const LazyVoiceAgent = lazy(() => import('@/components/agent/VoiceAgent'));
const LazyAgentChat = lazy(() => import('@/components/agent/AgentChat'));

// Memoized stat card to prevent unnecessary re-renders
export const OptimizedStatCard = memo(function OptimizedStatCard({ 
  title, 
  value, 
  icon, 
  trend,
  onClick 
}: { 
  title: string; 
  value: string; 
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  onClick?: () => void;
}) {
  const trendIcon = useMemo(() => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  }, [trend]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div 
      className={`bg-gray-800 rounded-lg p-4 sm:p-6 transition-all hover:bg-gray-750 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl">{icon}</span>
          {trend && <span className="text-sm">{trendIcon}</span>}
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white break-all">{value}</p>
    </div>
  );
});

// Virtualized list for large datasets
export const VirtualizedList = memo(function VirtualizedList<T>({ 
  items, 
  renderItem,
  itemHeight = 60,
  containerHeight = 400 
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemsCount, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div 
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Lazy loaded agent components with fallbacks
export function LazyVoiceAgentWrapper(props: any) {
  return (
    <Suspense fallback={
      <LoadingCard className="h-96" />
    }>
      <LazyVoiceAgent {...props} />
    </Suspense>
  );
}

export function LazyAgentChatWrapper(props: any) {
  return (
    <Suspense fallback={
      <div className="bg-gray-800 rounded-lg p-6">
        <LoadingSkeleton lines={8} className="mb-4" />
        <div className="h-12 bg-gray-700 rounded animate-pulse" />
      </div>
    }>
      <LazyAgentChat {...props} />
    </Suspense>
  );
}

// Debounced input for search/filtering
export const DebouncedInput = memo(function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
    />
  );
});

// Intersection Observer hook for lazy loading content
export function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  React.useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, options]);

  return isIntersecting;
}

// Lazy load content when it becomes visible
export const LazySection = memo(function LazySection({
  children,
  fallback = <LoadingCard />,
  className = ''
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const targetRef = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(targetRef, {
    rootMargin: '100px' // Load content 100px before it becomes visible
  });

  return (
    <div ref={targetRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
});