'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Erro crítico
          </h1>
          <p className="max-w-sm text-sm text-gray-500">
            A aplicação encontrou um erro grave. Nossa equipe foi notificada.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
