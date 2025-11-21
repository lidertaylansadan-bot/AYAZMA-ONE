import { useEffect } from 'react'
import { subscribeToProjects, subscribeToWizardSessions, presenceChannel, broadcastChannel } from '../lib/realtime'

export function useRealtime({ onProjectChange, onWizardChange }: {
  onProjectChange?: (payload: any) => void
  onWizardChange?: (payload: any) => void
}) {
  useEffect(() => {
    const proj = subscribeToProjects((payload) => {
      onProjectChange?.(payload)
    })
    const wiz = subscribeToWizardSessions((payload) => {
      onWizardChange?.(payload)
    })

    const presence = presenceChannel()
    presence.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presence.track({ online_at: Date.now() })
      }
    })

    const bc = broadcastChannel()
    bc.subscribe()

    return () => {
      proj.unsubscribe()
      wiz.unsubscribe()
      presence.unsubscribe()
      bc.unsubscribe()
    }
  }, [onProjectChange, onWizardChange])
}