'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import { useTrialContext } from '@/context/TrialContext'

function MurderMysteryPage() {
  const [setting, setSetting] = useState('')
  const [numberOfSuspects, setNumberOfSuspects] = useState('3')
  const [complexity, setComplexity] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [mystery, setMystery] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const { trialInfo, refreshTrialInfo, subscriptionStatus } = useTrialContext()

  const trialRemaining = subscriptionStatus === 'active'
    ? Infinity
    : trialInfo?.remaining ?? Math.max(0, 10 - (trialInfo?.used ?? 0))
  const trialActive = subscriptionStatus === 'active' || (trialInfo?.active && trialRemaining > 0)

  async function handleGenerate() {
    if (!setting.trim()) return

    if (!trialActive) {
      setFeedback({ type: 'warning', message: 'Trial limit reached. Subscribe to keep generating mysteries.' })
      return
    }

    setLoading(true)
    setMystery('')
    setFeedback({ type: '', message: '' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in again.')

      const response = await fetch('/api/murder-mystery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting,
          numberOfSuspects,
          complexity,
          userId: user?.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate mystery')
      }

      setMystery(data.mystery)
      // Call refreshTrialInfo to get the latest trial status from the database
      refreshTrialInfo()
      setFeedback({ type: 'success', message: 'Mystery generated successfully.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!mystery) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_content')
        .insert({
          user_id: user.id,
          tool_type: 'murder_mystery',
          title: `Murder Mystery: ${setting}`,
          content: { setting, numberOfSuspects, complexity, mystery }
        })

      if (error) throw error
      setFeedback({ type: 'success', message: 'Mystery saved successfully!' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  return (
    <DashboardLayout>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#a1a1aa', letterSpacing: '0.2em', fontSize: '12px', textTransform: 'uppercase' }}>
              Story Lab
            </p>
            <h1 style={{ fontSize: '36px', marginTop: '4px' }}>Murder Mystery Generator</h1>
            <p style={{ color: '#9ca3af', maxWidth: '520px' }}>
              Design immersive whodunits complete with suspects, motives, alibis, and climactic reveals.
            </p>
          </div>
          <div style={{
            background: '#11111a',
            border: '1px solid #262638',
            borderRadius: '16px',
            padding: '16px 24px',
            textAlign: 'right'
          }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', letterSpacing: '0.1em' }}>TRIAL STATUS</p>
            <p style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: trialActive ? '#fbbf24' : '#f87171' }}>
              {subscriptionStatus === 'active' ? 'Unlimited' : `${trialInfo?.active ? trialRemaining : 0} credits left`}
            </p>
          </div>
        </div>

        {feedback.message && (
          <div style={{
            borderRadius: '12px',
            padding: '14px 18px',
            border: feedback.type === 'success' ? '1px solid #14532d' : feedback.type === 'warning' ? '1px solid #92400e' : '1px solid #7f1d1d',
            background: feedback.type === 'success' ? '#052e16' : feedback.type === 'warning' ? '#422006' : '#3f1d1d',
            color: '#fef3c7'
          }}>
            {feedback.message}
          </div>
        )}

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div className="card" style={{ borderColor: '#2e2e3f' }}>
            <h2 style={{ marginBottom: '16px' }}>Mystery Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5f5', fontSize: '14px' }}>
                  Setting *
                </label>
                <input
                  type="text"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  className="input"
                  placeholder="Victorian manor, neon city..."
                  disabled={loading}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5f5', fontSize: '14px' }}>
                    Suspects
                  </label>
                  <select
                    value={numberOfSuspects}
                    onChange={(e) => setNumberOfSuspects(e.target.value)}
                    className="input"
                    disabled={loading}
                  >
                    {[2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5f5', fontSize: '14px' }}>
                    Complexity
                  </label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    className="input"
                    disabled={loading}
                  >
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="btn btn-primary"
                disabled={loading || !setting.trim() || !trialActive}
                style={{ width: '100%' }}
              >
                {loading ? <><span className="loading"></span> Generating...</> : 'Generate Mystery'}
              </button>
              {!trialActive && subscriptionStatus !== 'active' && (
                <p style={{ color: '#fca5a5', fontSize: '14px', textAlign: 'center' }}>
                  Trial credits exhausted. Subscribe to keep generating mysteries.
                </p>
              )}
            </div>
          </div>

          <div className="card" style={{ borderColor: '#2e2e3f', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '16px' }}>Generated Story</h2>
            {mystery ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start', // AI messages are left-aligned
                  marginBottom: '15px',
                  flex: 1, // Allow it to grow
                  overflowY: 'auto', // Keep scroll for long content
                }}
              >
                {/* AI Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#43e97b', // AI avatar background color
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px',
                    flexShrink: 0, // Prevent shrinking
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '60%', height: '60%', color: '#0a0a0a' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zm5.885-3.5L18 15.75l-1.996 1.996a3 3 0 00-1.996 1.996L12.25 21l-1.75-1.75a3 3 0 00-1.996-1.996L6 15.75l1.996-1.996a3 3 0 001.996-1.996L12.25 9l1.75 1.75a3 3 0 001.996 1.996z" />
                  </svg>
                </div>

                <div
                  style={{
                    maxWidth: '90%', // Adjust width as needed for single output
                    padding: '12px 18px',
                    borderRadius: '20px',
                    backgroundColor: '#1a1a1a', // AI dark background
                    color: '#ffffff', // White text
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    flex: 1, // Allow content to take available space
                  }}
                >
                  <ReactMarkdown>{mystery}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                border: '1px dashed #1f1f2e',
                borderRadius: '12px'
              }}>
                Your mystery will appear here after generation.
              </div>
            )}
            {mystery && (
              <button onClick={handleSave} className="btn btn-secondary" style={{ marginTop: '16px' }}>
                💾 Save Mystery
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default dynamic(() => Promise.resolve(MurderMysteryPage), { ssr: false })
