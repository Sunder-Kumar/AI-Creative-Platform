'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import { useTrialContext } from '@/context/TrialContext'

function GameStoryPage() {
  const [gameType, setGameType] = useState('')
  const [theme, setTheme] = useState('')
  const [numberOfCharacters, setNumberOfCharacters] = useState('3')
  const [loading, setLoading] = useState(false)
  const [story, setStory] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const { trialInfo, refreshTrialInfo, subscriptionStatus } = useTrialContext()

  const trialRemaining = subscriptionStatus === 'active'
    ? Infinity
    : trialInfo?.remaining ?? Math.max(0, 10 - (trialInfo?.used ?? 0))
  const trialActive = subscriptionStatus === 'active' || (trialInfo?.active && trialRemaining > 0)

  async function handleGenerate() {
    if (!gameType.trim()) return

    if (!trialActive) {
      setFeedback({ type: 'warning', message: 'Trial limit reached. Subscribe to continue generating stories.' })
      return
    }

    setLoading(true)
    setStory('')
    setFeedback({ type: '', message: '' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in again.')

      const response = await fetch('/api/game-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType,
          theme,
          numberOfCharacters,
          userId: user?.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate story')
      }

      setStory(data.story)
      // Call refreshTrialInfo to get the latest trial status from the database
      refreshTrialInfo()
      setFeedback({ type: 'success', message: 'Story generated successfully.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!story) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_content')
        .insert({
          user_id: user.id,
          tool_type: 'game_story',
          title: `Game Story: ${gameType}`,
          content: { gameType, theme, numberOfCharacters, story }
        })

      if (error) throw error
      setFeedback({ type: 'success', message: 'Story saved successfully!' })
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
              Narrative Forge
            </p>
            <h1 style={{ fontSize: '36px', marginTop: '4px' }}>Game Story + Characters Generator</h1>
            <p style={{ color: '#9ca3af', maxWidth: '520px' }}>
              Build immersive quests, lore-rich worlds, and fully sketched characters tailored to your game genre.
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
            <h2 style={{ marginBottom: '16px' }}>Game Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5f5', fontSize: '14px' }}>
                  Game Type *
                </label>
                <input
                  type="text"
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  className="input"
                  placeholder="RPG, Roguelike, Visual Novel..."
                  disabled={loading}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5f5', fontSize: '14px' }}>
                    Theme
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="input"
                    placeholder="Cyberpunk, Mythic, Noir..."
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5f5', fontSize: '14px' }}>
                    Characters
                  </label>
                  <select
                    value={numberOfCharacters}
                    onChange={(e) => setNumberOfCharacters(e.target.value)}
                    className="input"
                    disabled={loading}
                  >
                    {[2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="btn btn-primary"
                disabled={loading || !gameType.trim() || !trialActive}
                style={{ width: '100%' }}
              >
                {loading ? <><span className="loading"></span> Generating...</> : 'Generate Story & Characters'}
              </button>
              {!trialActive && subscriptionStatus !== 'active' && (
                <p style={{ color: '#fca5a5', fontSize: '14px', textAlign: 'center' }}>
                  Trial credits exhausted. Subscribe to keep generating stories.
                </p>
              )}
            </div>
          </div>

          <div className="card" style={{ borderColor: '#2e2e3f', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '16px' }}>Narrative Output</h2>
            {story ? (
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
                  <ReactMarkdown>{story}</ReactMarkdown>
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
                Your narrative will appear here after generation.
              </div>
            )}
            {story && (
              <button onClick={handleSave} className="btn btn-secondary" style={{ marginTop: '16px' }}>
                💾 Save Story
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default dynamic(() => Promise.resolve(GameStoryPage), { ssr: false })
