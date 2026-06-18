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

    const { gameType, theme, numberOfCharacters, userId } = await request.json()

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
          message: 'Trial limit reached. Please subscribe to continue generating stories.',
        },
        { status: 403 }
      )
    }

    const prompt = `Create a comprehensive game story and character profiles for the following:

Game Type: ${gameType}
${theme ? `Theme: ${theme}` : ''}
Number of Characters: ${numberOfCharacters}

Please provide:

1. GAME STORY OVERVIEW:
   - Main plot and narrative arc
   - World/setting description
   - Key story beats and progression
   - Major conflicts and challenges
   - Multiple endings or branching paths (if applicable)

2. CHARACTER PROFILES (${numberOfCharacters} characters):
   For each character, provide:
   - Name and appearance
   - Background and history
   - Personality traits
   - Skills/abilities
   - Role in the story
   - Character arc and development
   - Relationships with other characters
   - Motivations and goals

3. GAMEPLAY INTEGRATION:
   - How the story connects to gameplay
   - Key quests or missions
   - Important dialogue or cutscenes
   - Player choices and consequences

Make it detailed, immersive, and suitable for a ${gameType} game.`

    const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 700;

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert game writer and narrative designer specializing in video game storytelling, character development, and interactive narratives. Create compelling game stories with rich characters and engaging plots.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.85,
      max_tokens: maxTokens,
    })

    const story = completion.choices[0].message.content

    let trialPayload = null
    if (!trialContext.hasSubscription) {
      trialPayload = await consumeTrialCredit(userId, trialContext.trial.used)
    }

    return NextResponse.json({ story, trial: trialPayload })
  } catch (error) {
    console.error('Game story API error:', error)
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
      { error: error.message || 'Failed to generate story' },
      { status: 500 }
    )
  }
}

