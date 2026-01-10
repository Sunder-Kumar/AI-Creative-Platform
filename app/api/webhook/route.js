import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Server configuration error: Stripe not configured' },
      { status: 500 }
    )
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Server configuration error: Supabase not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'active',
              stripe_subscription_id: session.subscription,
            })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const status = subscription.status === 'active' ? 'active' : 'free'
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: status,
              stripe_subscription_id: status === 'active' ? subscription.id : null,
            })
            .eq('id', profile.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

