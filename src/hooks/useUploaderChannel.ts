import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { error as logError, info as logInfo } from '../log'

function generateURL(slug: string): string {
  const hostPrefix =
    window.location.protocol +
    '//' +
    window.location.hostname +
    (window.location.port ? ':' + window.location.port : '')
  return `${hostPrefix}/download/${slug}`
}

export function useUploaderChannel(
  uploaderPeerID: string,
  renewInterval = 60_000,
): {
  isLoading: boolean
  error: Error | null
  longSlug: string | undefined
  shortSlug: string | undefined
  longURL: string | undefined
  shortURL: string | undefined
} {
  const { isLoading, error, data } = useQuery({
    queryKey: ['uploaderChannel', uploaderPeerID],
    queryFn: async () => {
      logInfo(
        '[UploaderChannel] creating new channel for peer %s',
        uploaderPeerID,
      )
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploaderPeerID }),
      })
      if (!response.ok) {
        logError(
          '[UploaderChannel] failed to create channel: %d',
          response.status,
        )
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      logInfo('[UploaderChannel] channel created successfully: longSlug=%s, shortSlug=%s', 
        data.longSlug,
        data.shortSlug,
      )
      return data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  })

  const secret = data?.secret
  const longSlug = data?.longSlug
  const shortSlug = data?.shortSlug
  const longURL = longSlug ? generateURL(longSlug) : undefined
  const shortURL = shortSlug ? generateURL(shortSlug) : undefined

  const renewMutation = useMutation({
    mutationFn: async ({ secret: s }: { secret: string }) => {
      logInfo('[UploaderChannel] renewing channel for slug %s', shortSlug)
      const response = await fetch('/api/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: shortSlug, secret: s }),
      })
      if (!response.ok) {
        logError(
          '[UploaderChannel] failed to renew channel: %d',
          response.status,
        )
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      logInfo('[UploaderChannel] channel renewed successfully')
      return data
    },
  })

  useEffect(() => {
    if (!secret || !shortSlug) return

    let timeout: NodeJS.Timeout | null = null

    const run = (): void => {
      timeout = setTimeout(() => {
        logInfo(
          '[UploaderChannel] scheduling channel renewal in %d ms',
          renewInterval,
        )
        renewMutation.mutate({ secret })
        run()
      }, renewInterval)
    }

    run()

    return () => {
      if (timeout) {
        logInfo('[UploaderChannel] clearing renewal timeout')
        clearTimeout(timeout)
      }
    }
  }, [secret, shortSlug, renewMutation, renewInterval])

  useEffect(() => {
    if (!shortSlug || !secret) return

    const handleUnload = (): void => {
      logInfo('[UploaderChannel] destroying channel on page unload')
      // Using sendBeacon for best-effort delivery during page unload
      navigator.sendBeacon('/api/destroy', JSON.stringify({ slug: shortSlug }))
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [shortSlug, secret])

  return {
    isLoading,
    error,
    longSlug,
    shortSlug,
    longURL,
    shortURL,
  }
}
