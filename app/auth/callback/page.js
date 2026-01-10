'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    handleAuthCallback()
  }, [])

  async function handleAuthCallback() {
    try {
      // Handle the auth callback from email confirmation
      const { data, error } = await supabase.auth.getSession()
      
      if (error) throw error

      if (data.session) {
        router.push('/dashboard')
      } else {
        // Try to get the hash from URL and exchange it for a session
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) throw sessionError
          if (sessionData.session) {
            router.push('/dashboard')
            return
          }
        }

        setError('Authentication failed. Please try signing in again.')
        setLoading(false)
      }
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: '#1a1a1a',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div className="loading" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: '#888' }}>Confirming your email...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        {error ? (
          <>
            <h2 style={{ color: '#ff4444', marginBottom: '20px' }}>Error</h2>
            <p style={{ color: '#888', marginBottom: '20px' }}>{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '20px' }}>Email Confirmed!</h2>
            <p style={{ color: '#888', marginBottom: '20px' }}>
              Your email has been confirmed. Redirecting to dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: '#1a1a1a',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div className="loading" style={{ margin: '0 auto 20px' }}></div>
          <p style={{ color: '#888' }}>Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

