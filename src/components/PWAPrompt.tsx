import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import { 
  Download, 
  Smartphone, 
  X, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Bell,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError, showInfo } from '@/utils/toast';

interface PWAPromptProps {
  className?: string;
}

export const PWAPrompt: React.FC<PWAPromptProps> = ({ className }) => {
  const { 
    isInstallable, 
    isInstalled, 
    isOffline, 
    promptInstall, 
    updateAvailable, 
    reloadApp 
  } = usePWA();
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);

  // Show install prompt after a delay if installable and not dismissed
  useEffect(() => {
    if (isInstallable && !installPromptDismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, installPromptDismissed, isInstalled]);

  // Handle install
  const handleInstall = async () => {
    try {
      await promptInstall();
      setShowInstallPrompt(false);
      
      showSuccess("¡Aplicación instalada! Visionday está ahora disponible en tu dispositivo", { duration: 5000 });
    } catch (error) {
      console.error('Install failed:', error);
      showError("Error de instalación: No se pudo instalar la aplicación");
    }
  };

  // Handle update
  const handleUpdate = () => {
    reloadApp();
    showInfo("Actualizando... La aplicación se está actualizando");
  };

  // Dismiss install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setInstallPromptDismissed(true);
    
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Check if prompt was previously dismissed
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setInstallPromptDismissed(true);
    }
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Offline Status Indicator */}
      {isOffline && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardContent className="flex items-center gap-3 p-4">
            <WifiOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Sin conexión
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                La app funciona offline con funciones limitadas
              </p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Offline
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* App Update Available */}
      {updateAvailable && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="flex items-center gap-3 p-4">
            <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Actualización disponible
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Hay una nueva versión de la aplicación
              </p>
            </div>
            <Button 
              onClick={handleUpdate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Actualizar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Install PWA Prompt */}
      {showInstallPrompt && isInstallable && !isInstalled && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Instalar Visionday</CardTitle>
                  <CardDescription>
                    Accede más rápido y usa la app offline
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={dismissInstallPrompt}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Funciona offline</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4 text-blue-500" />
                  <span>Acceso rápido</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-purple-500" />
                  <span>Notificaciones push</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-orange-500" />
                  <span>Experiencia nativa</span>
                </div>
              </div>

              {/* Install Button */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleInstall}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar App
                </Button>
                <Button 
                  variant="outline" 
                  onClick={dismissInstallPrompt}
                  className="px-6"
                >
                  Más tarde
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PWA Installed Confirmation */}
      {isInstalled && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                ¡App instalada correctamente!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Visionday está disponible en tu dispositivo
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Instalada
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Connection Restored */}
      {!isOffline && (
        <div className="sr-only" aria-live="polite">
          Conexión restaurada
        </div>
      )}
    </div>
  );
};