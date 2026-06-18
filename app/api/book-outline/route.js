import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getTrialContext, consumeTrialCredit } from '@/lib/trial'

export async function POST(request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    if (!openai) {
      return NextResponse.json(
        { error: 'Server configuration error: OpenRouter not configured' },
        { status: 500 }
      )
    }

    const { topic, genre, targetAudience, userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const trialContext = await getTrialContext(userId)
    if (trialContext.error === 'PROFILE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Unable to find user profile' },
        { status: 404 }
      )
    }

    if (!trialContext.hasSubscription && !trialContext.trial.active) {
      return NextResponse.json(
        {
          error: 'TRIAL_LIMIT',
          message: 'Trial limit reached. Please subscribe to continue generating outlines.',
        },
        { status: 403 }
      )
    }

    const prompt = `Create a detailed book outline for the following:

Topic/Title: ${topic}
${genre ? `Genre: ${genre}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Please provide:
1. A compelling hook/opening
2. Main characters and their arcs
3. Three-act structure breakdown
4. Key plot points and turning points
5. Themes and motifs
6. Chapter-by-chapter outline (at least 10 chapters)
7. Resolution and ending

Make it detailed, engaging, and ready for writing.`

    const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 700;

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert book writing coach and story structure specialist. Create detailed, professional book outlines that help writers bring their stories to life.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
    })

    const outline = completion.choices[0].message.content

    let trialPayload = null
    if (!trialContext.hasSubscription) {
      trialPayload = await consumeTrialCredit(userId, trialContext.trial.used)
    }

    return NextResponse.json({ outline, trial: trialPayload })
  } catch (error) {
    console.error('Book outline API error:', error)
    // OpenRouter returns 402 when out of credits
    if (error?.status === 402 || error?.code === 402 || String(error?.message).toLowerCase().includes('credit')) {
      return NextResponse.json(
        {
          error: 'OUT_OF_CREDITS',
          message: 'OpenRouter credits exhausted. Visit https://openrouter.ai/settings/credits to upgrade or reduce max tokens.',
        },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate outline' },
      { status: 500 }
    )
  }
}

