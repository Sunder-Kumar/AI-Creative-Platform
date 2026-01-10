import { supabaseAdmin } from './supabase-server'

export const TRIAL_LIMIT = 10

function buildTrialPayload(usedCount) {
  const used = typeof usedCount === 'number' ? usedCount : 0
  const remaining = Math.max(0, TRIAL_LIMIT - used)
  return {
    used,
    remaining,
    total: TRIAL_LIMIT,
    active: remaining > 0,
  }
}

export async function getTrialContext(userId) {
  if (!supabaseAdmin) {
    throw new Error('Server configuration error: Supabase not configured')
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, trial_chats_used, trial_active')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return { error: 'PROFILE_NOT_FOUND' }
  }

  const used = profile.trial_chats_used ?? 0
  const trial = buildTrialPayload(used)
  trial.active = profile.trial_active !== false && trial.remaining > 0

  return {
    profile,
    hasSubscription: profile.subscription_status === 'active',
    trial,
  }
}

export async function consumeTrialCredit(userId, currentUsed = 0) {
  if (!supabaseAdmin) {
    throw new Error('Server configuration error: Supabase not configured')
  }

  const nextUsed = Math.min(TRIAL_LIMIT, currentUsed + 1)
  const stillActive = nextUsed < TRIAL_LIMIT

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      trial_chats_used: nextUsed,
      trial_active: stillActive,
    })
    .eq('id', userId)
    .select('trial_chats_used, trial_active')
    .single()

  if (error || !data) {
    throw new Error('Failed to update trial usage')
  }

  const trial = buildTrialPayload(data.trial_chats_used)
  trial.active = data.trial_active
  return trial
}

