import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Supabase not configured' },
        { status: 500 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Server configuration error: Stripe not configured' },
        { status: 500 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user profile (contains email)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get user email from profile or auth.users
    let userEmail = profile.email
    
    // If email not in profile, get from auth.users
    if (!userEmail) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authError || !authUser?.user?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 404 }
        )
      }
      userEmail = authUser.user.email
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id

      // Update profile with customer ID
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Creative Platform Premium',
              description: 'Monthly subscription for unlimited AI tools',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/subscribe?canceled=true`,
      metadata: {
        userId: userId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

