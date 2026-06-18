import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getTrialContext, consumeTrialCredit } from '@/lib/trial';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();

    if (!userId) {
      return new Response('User not authenticated', { status: 401 });
    }

    const trialContext = await getTrialContext(userId);

    if (trialContext.error) {
      return new Response(trialContext.error, { status: 404 });
    }

    if (!trialContext.hasSubscription && !trialContext.trial.active) {
      return new Response('Trial limit reached. Please subscribe.', {
        status: 403,
      });
    }

    if (!trialContext.hasSubscription) {
      await consumeTrialCredit(userId, trialContext.trial.used);
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const result = await streamText({
      model: openai('openai/gpt-4-turbo'), // OpenRouter model identifier
      messages,
    });
    return new Response(
      result.textStream,
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    if (error?.status === 402 || error?.code === 402 || String(error?.message).toLowerCase().includes('credit')) {
      return new Response(
        JSON.stringify({
          error: 'OUT_OF_CREDITS',
          message: 'OpenRouter credits exhausted. Visit https://openrouter.ai/settings/credits to upgrade or reduce max tokens.',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      error?.message || 'Failed to generate response',
      { status: 500 }
    );
  }
}
