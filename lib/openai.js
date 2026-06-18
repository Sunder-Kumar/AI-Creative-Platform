import OpenAI from 'openai'

// Initialize OpenRouter API (compatible with OpenAI SDK)
const openai = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  : null

export default openai

