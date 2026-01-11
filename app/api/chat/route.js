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
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await streamText({
      model: openai('gpt-4.1-mini'), // ✅ safer + supported
      messages,
    });

    return result.toResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      error?.message || 'Failed to generate response',
      { status: 500 }
    );
  }
}
