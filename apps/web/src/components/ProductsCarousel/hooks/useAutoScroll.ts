import { useEffect, useRef, useCallback, useState } from 'react';
import { PauseReason } from '../types';

export interface AutoScrollConfig {
  interval: number; // 5000ms
  initialDelay: number; // 3000ms
  pauseOnHoverDuration: number; // 1000ms
  pauseOnInteractionDuration: number; // 10000ms
}

export interface UseAutoScrollReturn {
  pause: (reason: PauseReason) => void;
  resume: (reason: PauseReason) => void;
  isActive: boolean;
}

export function useAutoScroll(
  onNext: () => void,
  config: AutoScrollConfig
): UseAutoScrollReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Iniciar intervalo de auto-scroll
  const startInterval = useCallback(() => {
    // Limpar intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Criar novo intervalo
    intervalRef.current = setInterval(() => {
      onNext();
    }, config.interval);

    setIsActive(true);
  }, [onNext, config.interval]);

  // Pausar auto-scroll
  const pause = useCallback((reason: PauseReason) => {
    // Limpar intervalo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Limpar timeout de resume pendente
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }

    setIsActive(false);
  }, []);

  // Retomar auto-scroll após duração específica
  const resume = useCallback(
    (reason: PauseReason) => {
      // Limpar timeout de resume pendente
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }

      // Determinar duração baseada no motivo
      const duration =
        reason === 'hover'
          ? config.pauseOnHoverDuration
          : config.pauseOnInteractionDuration;

      // Agendar retomada
      resumeTimeoutRef.current = setTimeout(() => {
        startInterval();
      }, duration);
    },
    [startInterval, config.pauseOnHoverDuration, config.pauseOnInteractionDuration]
  );

  // Iniciar auto-scroll após delay inicial
  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      startInterval();
    }, config.initialDelay);

    // Cleanup: limpar todos os timers no unmount
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [startInterval, config.initialDelay]);

  return {
    pause,
    resume,
    isActive,
  };
}
