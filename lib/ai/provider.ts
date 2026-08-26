import { google } from '@ai-sdk/google'

export function getAIProvider() {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.')
  }

  // We use flash for speed and cost efficiency on standard insight tasks
  return google('gemini-2.5-flash')
}

// Fallback checking helper for UI
export function isAIConfigured() {
  return !!process.env.GEMINI_API_KEY
}
