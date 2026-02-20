'use client'

import React from 'react'
import { SWRConfig } from 'swr'
import { ThemeProvider } from 'next-themes'
import { WebSocketProvider } from '@/components/websocket-provider'
import { NotificationProvider } from '@/components/notification-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { useAppStore } from '@/store/useAppStore'
import { API_CONFIG } from '@/lib/api'

interface ProvidersProps {
  children: React.ReactNode
}

// SWR configuration with error handling and caching
const swrConfig = {
  ...API_CONFIG.swrConfig,
  fetcher: async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
      const error = new Error('Failed to fetch data')
      // Attach extra info to error object
      error.cause = {
        status: res.status,
        statusText: res.statusText,
        url,
      }
      throw error
    }
    return res.json()
  },
  onError: (error: any, key: string) => {
    console.error('SWR Error:', { error, key })
    
    // Add notification for critical errors
    const { addNotification } = useAppStore.getState()
    if (error.cause?.status >= 500) {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your connection.',
        duration: 5000,
      })
    }
  },
  onErrorRetry: (error: any, key: string, config: any, revalidate: any, { retryCount }: any) => {
    // Don't retry on 404
    if (error.cause?.status === 404) return
    
    // Don't retry for user-specific errors
    if (error.cause?.status === 401 || error.cause?.status === 403) return
    
    // Only retry up to 3 times
    if (retryCount >= 3) return
    
    // Exponential backoff
    setTimeout(() => revalidate({ retryCount }), 1000 * Math.pow(2, retryCount))
  },
  // Global loading timeout
  loadingTimeout: 10000,
  // Global error retry interval
  errorRetryInterval: 5000,
  // Dedupe requests within 2 seconds
  dedupingInterval: 2000,
}

// Theme configuration
const themeConfig = {
  attribute: 'class',
  defaultTheme: 'system',
  enableSystem: true,
  disableTransitionOnChange: false,
  storageKey: 'cgc-theme',
  themes: ['light', 'dark', 'system'],
}

// Store hydration component
function StoreHydration() {
  const hydrate = useAppStore((state) => state.hydrate)
  
  React.useEffect(() => {
    hydrate()
  }, [hydrate])
  
  return null
}

// Performance monitoring component
function PerformanceMonitor() {
  React.useEffect(() => {
    // Monitor performance metrics
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navigation = entry as PerformanceNavigationTiming
            console.log('Navigation metrics:', {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: navigation.responseEnd - navigation.requestStart,
            })
          }
          
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}:`, entry.startTime)
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime)
          }
        }
      })
      
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
      
      return () => observer.disconnect()
    }
  }, [])
  
  return null
}

// Accessibility monitor
function AccessibilityMonitor() {
  React.useEffect(() => {
    // Monitor for accessibility violations in development
    if (process.env.NODE_ENV === 'development') {
      import('@axe-core/react').then((axe) => {
        axe.default(React, document, 1000)
      }).catch(console.error)
    }
  }, [])
  
  return null
}

// Service worker registration
function ServiceWorkerProvider() {
  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }
  }, [])
  
  return null
}

// Network status monitor
function NetworkStatusProvider() {
  const setWebSocketState = useAppStore((state) => state.setWebSocketState)
  const addNotification = useAppStore((state) => state.addNotification)
  
  React.useEffect(() => {
    const handleOnline = () => {
      addNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online.',
        duration: 3000,
      })
    }
    
    const handleOffline = () => {
      addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'You appear to be offline. Some features may not work.',
        duration: 5000,
      })
      setWebSocketState({ connected: false, error: 'Network offline' })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setWebSocketState, addNotification])
  
  return null
}

// Focus management for accessibility
function FocusManager() {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content on Alt+S
      if (event.altKey && event.key === 's') {
        event.preventDefault()
        const main = document.getElementById('main-content')
        main?.focus()
      }
      
      // Toggle navigation on Alt+N
      if (event.altKey && event.key === 'n') {
        event.preventDefault()
        const nav = document.querySelector('[role="navigation"]')
        if (nav instanceof HTMLElement) {
          nav.focus()
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  
  return null
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider {...themeConfig}>
        <SWRConfig value={swrConfig}>
          <WebSocketProvider>
            <NotificationProvider>
              <StoreHydration />
              <PerformanceMonitor />
              <AccessibilityMonitor />
              <ServiceWorkerProvider />
              <NetworkStatusProvider />
              <FocusManager />
              {children}
            </NotificationProvider>
          </WebSocketProvider>
        </SWRConfig>
      </ThemeProvider>
    </ErrorBoundary>
  )
}