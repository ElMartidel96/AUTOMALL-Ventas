'use client'

import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, Info, XCircle, Bell } from 'lucide-react'

interface NotificationProviderProps {
  children: React.ReactNode
}

const notificationIcons = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertCircle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
}

const notificationColors = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { notifications, removeNotification } = useAppStore()
  
  // Auto-remove notifications after their duration
  React.useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id)
        }, notification.duration)
        
        return () => clearTimeout(timer)
      }
    })
  }, [notifications, removeNotification])

  // Play sound effects for notifications (if enabled)
  const playNotificationSound = React.useCallback((type: string) => {
    const preferences = useAppStore.getState().preferences
    if (!preferences.soundEnabled || !preferences.theme.soundEffects) return
    
    try {
      const audio = new Audio(`/sounds/${type}.mp3`)
      audio.volume = 0.3
      audio.play().catch(console.error)
    } catch (error) {
      // Ignore audio errors
    }
  }, [])

  // Play sound when new notifications are added
  React.useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0]
      if (latestNotification && 
          Date.now() - latestNotification.timestamp.getTime() < 1000) { // If added within last second
        playNotificationSound(latestNotification.type)
      }
    }
  }, [notifications, playNotificationSound])

  return (
    <ToastProvider swipeDirection="right" duration={5000}>
      {children}
      
      {notifications.map((notification) => (
        <Toast 
          key={notification.id}
          className={cn(
            'group relative overflow-hidden border-l-4 pl-4',
            notificationColors[notification.type]
          )}
          onOpenChange={(open) => {
            if (!open) {
              removeNotification(notification.id)
            }
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {notificationIcons[notification.type]}
            </div>
            
            <div className="flex-1 min-w-0">
              <ToastTitle className="font-medium text-sm">
                {notification.title}
              </ToastTitle>
              
              {notification.message && (
                <ToastDescription className="text-sm mt-1 pr-2">
                  {notification.message}
                </ToastDescription>
              )}
              
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className="text-xs font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current rounded"
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            
            <ToastClose className="flex-shrink-0" />
          </div>
          
          {/* Progress bar for timed notifications */}
          {notification.duration && notification.duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-current transition-all linear"
                style={{
                  animation: `shrink ${notification.duration}ms linear forwards`,
                }}
              />
            </div>
          )}
        </Toast>
      ))}
      
      <ToastViewport />
      
      {/* Global notification styles */}
      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        [data-state="open"] {
          animation: slideIn 300ms ease-out;
        }
        
        [data-state="closed"] {
          animation: slideOut 300ms ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </ToastProvider>
  )
}

// Hook for easy notification access
export function useNotification() {
  const addNotification = useAppStore((state) => state.addNotification)
  const removeNotification = useAppStore((state) => state.removeNotification)
  const clearNotifications = useAppStore((state) => state.clearNotifications)
  
  const notify = React.useCallback({
    info: (title: string, message?: string, options?: { duration?: number; action?: any }) => 
      addNotification({ type: 'info', title, message, ...options }),
      
    success: (title: string, message?: string, options?: { duration?: number; action?: any }) => 
      addNotification({ type: 'success', title, message, ...options }),
      
    warning: (title: string, message?: string, options?: { duration?: number; action?: any }) => 
      addNotification({ type: 'warning', title, message, ...options }),
      
    error: (title: string, message?: string, options?: { duration?: number; action?: any }) => 
      addNotification({ type: 'error', title, message, ...options }),
      
    custom: (notification: Parameters<typeof addNotification>[0]) => 
      addNotification(notification),
  }, [addNotification])
  
  return {
    notify,
    remove: removeNotification,
    clear: clearNotifications,
  }
}

// Permission-based browser notifications
export function useBrowserNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default')
  
  React.useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])
  
  const requestPermission = React.useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission
    }
    return 'denied'
  }, [])
  
  const showBrowserNotification = React.useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(title, {
        icon: '/favicon-96x96.png',
        badge: '/favicon-96x96.png',
        tag: 'cryptogift-dao',
        renotify: false,
        requireInteraction: false,
        silent: false,
        ...options,
      })
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)
      
      return notification
    }
    return null
  }, [permission])
  
  return {
    permission,
    requestPermission,
    showBrowserNotification,
    isSupported: 'Notification' in window,
  }
}