"use client";

import { useEffect, useState } from 'react';
import { Bell, Volume2, Monitor } from 'lucide-react';

const PREFERENCES_KEY = 'admin-notification-preferences';

export interface NotificationPreferences {
  toast: boolean;
  browser: boolean;
  sound: boolean;
}

const defaultPreferences: NotificationPreferences = {
  toast: true,
  browser: true,
  sound: true
};

interface NotificationPreferencesProps {
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

/**
 * Component for managing notification preferences
 * 
 * Features:
 * - Toggle switches for toast, browser, and sound notifications
 * - Persist preferences in localStorage
 * - Display current browser notification permission status
 * - Request permission button if denied
 * 
 * @example
 * ```tsx
 * <NotificationPreferences 
 *   onPreferencesChange={(prefs) => console.log(prefs)}
 * />
 * ```
 */
export function NotificationPreferences({ onPreferencesChange }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  
  /**
   * Load preferences from localStorage on mount
   */
  useEffect(() => {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
      }
    }
    
    // Check browser notification permission
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);
  
  /**
   * Update preference and persist to localStorage
   */
  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    onPreferencesChange?.(updated);
  };
  
  /**
   * Request browser notification permission
   */
  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      
      if (permission === 'granted') {
        updatePreference('browser', true);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };
  
  /**
   * Get permission status label
   */
  const getPermissionLabel = () => {
    switch (browserPermission) {
      case 'granted':
        return 'Permitido';
      case 'denied':
        return 'Bloqueado';
      default:
        return 'Não solicitado';
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Preferências de Notificação</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure como você deseja receber alertas de novos pedidos.
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Toast Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Notificações Toast</p>
              <p className="text-sm text-gray-600">
                Alertas visuais temporários na tela
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.toast}
              onChange={(e) => updatePreference('toast', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
        
        {/* Browser Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Notificações do Navegador</p>
              <p className="text-sm text-gray-600">
                Alertas nativos mesmo em outras abas
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Status: <span className="font-medium">{getPermissionLabel()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {browserPermission === 'denied' && (
              <button
                onClick={requestBrowserPermission}
                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Solicitar
              </button>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.browser}
                onChange={(e) => updatePreference('browser', e.target.checked)}
                disabled={browserPermission !== 'granted'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
        
        {/* Sound Alerts */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">Alerta Sonoro</p>
              <p className="text-sm text-gray-600">
                Som de notificação quando novo pedido chega
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sound}
              onChange={(e) => updatePreference('sound', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>
      </div>
      
      {browserPermission === 'denied' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Notificações bloqueadas:</strong> Para receber notificações do navegador, 
            você precisa permitir nas configurações do seu navegador.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to load notification preferences
 */
export function useNotificationPreferences(): NotificationPreferences {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  
  useEffect(() => {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
      }
    }
  }, []);
  
  return preferences;
}
