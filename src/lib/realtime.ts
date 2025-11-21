import { supabase } from './supabase'

export function subscribeToProjects(onChange: (payload: any) => void) {
  const channel = supabase.channel('realtime:projects')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
    }, onChange)
    .subscribe()
  return channel
}

export function subscribeToWizardSessions(onChange: (payload: any) => void) {
  const channel = supabase.channel('realtime:wizards')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'app_wizard_sessions',
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'workflow_wizard_sessions',
    }, onChange)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'content_wizard_sessions',
    }, onChange)
    .subscribe()
  return channel
}

export function presenceChannel(room = 'dashboard') {
  const channel = supabase.channel(`presence:${room}`, {
    config: {
      presence: {
        key: Math.random().toString(36).slice(2),
      },
    },
  })

  return channel
}

export function broadcastChannel(room = 'dashboard') {
  return supabase.channel(`broadcast:${room}`)
}