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

    // Direct call to OpenRouter API with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo',
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: 'OUT_OF_CREDITS',
            message: 'OpenRouter credits exhausted. Visit https://openrouter.ai/settings/credits to upgrade.',
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    // Transform SSE stream to plain text stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }

              const text = decoder.decode(value, { stream: true });
              const lines = text.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    continue;
                  }
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(content);
                    }
                  } catch (e) {
                    // Ignore JSON parse errors
                  }
                }
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      }),
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
          message: 'OpenRouter credits exhausted. Visit https://openrouter.ai/settings/credits to upgrade.',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Chat failed',
        message: error?.message || 'Failed to generate response',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
