'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

function SubscribePage() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      const stripe = await stripePromise
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '20px', textAlign: 'center' }}>
            Upgrade to Premium
          </h1>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✨</div>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>$10/month</h2>
            <p style={{ color: '#888', marginBottom: '30px' }}>
              Unlimited access to all AI tools
            </p>

            <ul style={{
              textAlign: 'left',
              listStyle: 'none',
              marginBottom: '30px',
              padding: 0
            }}>
              <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                ✓ Unlimited AI Chat conversations
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                ✓ Generate unlimited book outlines
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                ✓ Create unlimited murder mysteries
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                ✓ Generate unlimited game stories
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                ✓ Save unlimited content
              </li>
              <li style={{ padding: '10px 0' }}>
                ✓ Priority support
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '18px', padding: '16px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading"></span> Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default dynamic(() => Promise.resolve(SubscribePage), { ssr: false })
