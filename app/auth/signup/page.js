'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation for Gmail domain
    if (!email.endsWith('@gmail.com')) {
      setError('Only Gmail accounts are allowed for sign-up.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        setError('')
        alert('Please check your email to confirm your account before signing in.')
        router.push('/auth/login')
      } else {
        // Auto sign-in (email confirmation disabled)
        router.push('/dashboard')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
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
        width: '100%',
        maxWidth: '400px',
        border: '1px solid #333'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AI Creative Platform
        </h1>
        <p style={{ color: '#888', marginBottom: '30px' }}>
          Create your account
        </p>

        {error && (
          <div style={{
            background: '#ff4444',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={loading}
          >
            {loading ? <span className="loading"></span> : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#888' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#667eea' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

