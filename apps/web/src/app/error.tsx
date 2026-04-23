'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-gray-800">
        Algo deu errado
      </h2>
      <p className="max-w-sm text-sm text-gray-500">
        Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Tentar novamente
      </button>
    </div>
  )
}
