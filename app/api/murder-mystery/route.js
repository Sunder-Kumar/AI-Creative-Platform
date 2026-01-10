import { NextResponse } from 'next/server'
import openai from '@/lib/openai'
import { getTrialContext, consumeTrialCredit } from '@/lib/trial'

export async function POST(request) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'Server configuration error: OpenAI not configured' },
        { status: 500 }
      )
    }

    const { setting, numberOfSuspects, complexity, userId } = await request.json()

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
          message: 'Trial limit reached. Please subscribe to continue generating mysteries.',
        },
        { status: 403 }
      )
    }

    const complexityInstructions = {
      simple: 'Keep the mystery straightforward with clear clues and obvious suspects.',
      medium: 'Include red herrings, multiple motives, and some misdirection.',
      complex: 'Create a complex web of relationships, hidden motives, multiple timelines, and sophisticated clues that require careful deduction.'
    }

    const prompt = `Create an engaging murder mystery story with the following details:

Setting: ${setting}
Number of Suspects: ${numberOfSuspects}
Complexity Level: ${complexity}

${complexityInstructions[complexity] || complexityInstructions.medium}

Please provide:
1. The victim and their background
2. The crime scene and initial discovery
3. Detailed profiles of all ${numberOfSuspects} suspects, including:
   - Name, age, occupation
   - Relationship to victim
   - Motive
   - Alibi
   - Suspicious behavior or clues
4. Key clues and evidence found
5. Red herrings (if applicable)
6. The solution: who did it, how, and why
7. A compelling narrative that builds suspense

Make it engaging, well-structured, and suitable for a murder mystery game or story.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert mystery writer specializing in murder mysteries, detective stories, and whodunits. Create engaging, well-crafted mysteries with compelling characters and clever plots.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 3000,
    })

    const mystery = completion.choices[0].message.content

    let trialPayload = null
    if (!trialContext.hasSubscription) {
      trialPayload = await consumeTrialCredit(userId, trialContext.trial.used)
    }

    return NextResponse.json({ mystery, trial: trialPayload })
  } catch (error) {
    console.error('Murder mystery API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate mystery' },
      { status: 500 }
    )
  }
}

