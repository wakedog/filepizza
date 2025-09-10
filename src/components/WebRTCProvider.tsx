'use client'

import React, {
  JSX,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react'
import Loading from './Loading'
import Peer from 'peerjs'
import { ErrorMessage } from './ErrorMessage'
import { error as logError, info as logInfo } from '../log'

export type WebRTCPeerValue = {
  peer: Peer
  stop: () => void
}

const WebRTCContext = React.createContext<WebRTCPeerValue | null>(null)

export const useWebRTCPeer = (): WebRTCPeerValue => {
  const value = useContext(WebRTCContext)
  if (value === null) {
    throw new Error('useWebRTC must be used within a WebRTCProvider')
  }
  return value
}

let globalPeer: Peer | null = null

async function getOrCreateGlobalPeer(): Promise<Peer> {
  if (!globalPeer) {
    const response = await fetch('/api/ice', {
      method: 'POST',
    })
    const { iceServers } = await response.json()
    logInfo('[WebRTCProvider] ICE servers loaded: %d servers', iceServers.length)

    globalPeer = new Peer({
      debug: 3,
      config: {
        iceServers,
      },
    })
  }

  if (globalPeer.id) {
    return globalPeer
  }

  await new Promise<void>((resolve) => {
    const listener = (id: string) => {
      logInfo('[WebRTCProvider] Peer ID: %s', id)
      globalPeer?.off('open', listener)
      resolve()
    }
    globalPeer?.on('open', listener)
  })

  return globalPeer
}

export default function WebRTCPeerProvider({
  children,
}: {
  children?: React.ReactNode
}): JSX.Element {
  const [peerValue, setPeerValue] = useState<Peer | null>(globalPeer)
  const [isStopped, setIsStopped] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const stop = useCallback(() => {
    logInfo('[WebRTCProvider] Stopping peer')
    globalPeer?.destroy()
    globalPeer = null
    setPeerValue(null)
    setIsStopped(true)
  }, [])

  useEffect(() => {
    getOrCreateGlobalPeer()
      .then((peer) => {
        logInfo('[WebRTCProvider] Peer initialized successfully with ID: %s', peer.id)
        setPeerValue(peer)
      })
      .catch((err) => {
        logError('[WebRTCProvider] Failed to initialize peer: %o', err)
        setError(err instanceof Error ? err : new Error('Failed to initialize WebRTC peer'))
      })
  }, [])

  const value = useMemo(() => ({ peer: peerValue!, stop }), [peerValue, stop])

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  if (isStopped) {
    return <></>
  }

  if (!peerValue) {
    return <Loading text="Initializing WebRTC peer..." />
  }

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  )
}
