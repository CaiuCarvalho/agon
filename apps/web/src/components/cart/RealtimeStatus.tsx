"use client";

import { useCart } from "@/modules/cart/hooks/useCart";
import { Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * RealtimeStatus Component
 * 
 * Shows Realtime connection status indicator (optional).
 * Displays when connection is lost and reconnecting.
 * 
 * This is an optional enhancement for better user feedback
 * during network issues.
 */
export function RealtimeStatus() {
  const { realtimeStatus } = useCart();
  const [showDisconnected, setShowDisconnected] = useState(false);

  useEffect(() => {
    if (realtimeStatus === 'disconnected') {
      // Show disconnected indicator after 2 seconds
      const timer = setTimeout(() => {
        setShowDisconnected(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowDisconnected(false);
    }
  }, [realtimeStatus]);

  return (
    <AnimatePresence>
      {showDisconnected && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-4 right-4 z-40 bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-lg max-w-xs"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                Reconectando...
              </p>
              <p className="text-xs text-orange-700">
                Sincronização pausada
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ConnectionIndicator Component
 * 
 * Small indicator that shows connection status in the navbar or cart icon.
 * Can be used as a subtle indicator without being intrusive.
 */
export function ConnectionIndicator() {
  const { realtimeStatus } = useCart();

  // Don't show indicator for idle state (not applicable)
  if (realtimeStatus === 'idle') {
    return null;
  }

  if (realtimeStatus === 'connected') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Wifi className="h-3 w-3" />
        <span className="hidden sm:inline">Sincronizado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-orange-600">
      <WifiOff className="h-3 w-3 animate-pulse" />
      <span className="hidden sm:inline">Offline</span>
    </div>
  );
}
