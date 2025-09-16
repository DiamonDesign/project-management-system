import { useEffect, useState, useCallback } from 'react';
import type { NavigatorExtended } from '@/types';

interface PWAHookReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  promptInstall: () => Promise<void>;
  installPromptEvent: BeforeInstallPromptEvent | null;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  reloadApp: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = (): PWAHookReturn => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully:', registration);
          setServiceWorkerRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content available');
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] Controller changed, reloading page...');
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  // Check if PWA is already installed
  useEffect(() => {
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isInStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorExtended).standalone === true;
      
      setIsInstalled(isInStandaloneMode);
    };

    checkIfInstalled();
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] Before install prompt triggered');
      e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PWA] Connection restored');
      setIsOffline(false);
    };

    const handleOffline = () => {
      console.log('[PWA] Connection lost');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install PWA function
  const promptInstall = useCallback(async (): Promise<void> => {
    if (!installPromptEvent) {
      console.warn('[PWA] No install prompt available');
      return;
    }

    try {
      await installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      
      console.log(`[PWA] User ${outcome} the install prompt`);
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPromptEvent(null);
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
    }
  }, [installPromptEvent]);

  // Reload app to apply updates
  const reloadApp = useCallback(() => {
    if (serviceWorkerRegistration?.waiting) {
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [serviceWorkerRegistration]);

  // Handle service worker messages
  useEffect(() => {
    const messageChannel = new MessageChannel();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE_READY') {
        setUpdateAvailable(true);
      }
    };

    messageChannel.port1.addEventListener('message', handleMessage);
    messageChannel.port1.start();

    if (serviceWorkerRegistration?.active) {
      serviceWorkerRegistration.active.postMessage(
        { type: 'INIT_PORT' }, 
        [messageChannel.port2]
      );
    }

    return () => {
      messageChannel.port1.removeEventListener('message', handleMessage);
    };
  }, [serviceWorkerRegistration]);

  return {
    isInstallable,
    isInstalled,
    isOffline,
    promptInstall,
    installPromptEvent,
    serviceWorkerRegistration,
    updateAvailable,
    reloadApp
  };
};