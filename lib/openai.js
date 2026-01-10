import OpenAI from 'openai'

// Only initialize if key exists (for server-side API routes)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export default openai

