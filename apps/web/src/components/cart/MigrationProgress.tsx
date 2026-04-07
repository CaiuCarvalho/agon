"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMigrationStatus } from "@/modules/cart/hooks/useMigrationStatus";

/**
 * MigrationProgress Component
 * 
 * Displays migration progress during login with visual feedback.
 * Shows loading indicator, success message, or error state.
 * 
 * This component should be rendered in the app layout to show
 * migration status when a user logs in with localStorage data.
 */
export function MigrationProgress() {
  const status = useMigrationStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show progress when migration is in progress
    if (status === 'in_progress') {
      setShow(true);
    }

    // Hide after success (with delay for user to see success message)
    if (status === 'complete' && show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Keep showing on error until user dismisses
    if (status === 'error') {
      setShow(true);
    }
  }, [status, show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-background border border-border shadow-lg rounded-lg p-4">
            {status === 'in_progress' && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Migrando seus dados...</p>
                  <p className="text-xs text-muted-foreground">
                    Transferindo carrinho e favoritos
                  </p>
                </div>
              </div>
            )}

            {status === 'complete' && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-600">
                    Migração concluída!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Seus itens foram salvos
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-destructive">
                    Erro na migração
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Seus itens foram preservados. Tente novamente mais tarde.
                  </p>
                </div>
                <button
                  onClick={() => setShow(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
