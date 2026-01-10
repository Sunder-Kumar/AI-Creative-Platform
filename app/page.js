'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const sessionPromise = supabase.auth.getSession()
      
      const { data, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]).catch(() => {
        // If timeout or error, just redirect to login
        return { data: { session: null }, error: null }
      })

      if (error) {
        console.error('Auth error:', error)
        router.push('/auth/login')
        return
      }

      if (data?.session) {
        router.push('/dashboard')
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#0a0a0a'
      }}>
        <div className="loading"></div>
      </div>
    )
  }

  return null
}

