import Groq from 'groq-sdk'
import { RedditPost, ScoredPost } from './reddit'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const INTENT_SYSTEM = `You are an expert B2B sales intelligence analyst. 
You evaluate Reddit posts for purchase intent on behalf of Typewise — an AI Agent Platform for enterprise customer service teams.
Typewise competes with Intercom Fin, Zendesk AI, and Freshdesk. It's used by Unilever, DPD, and 60+ enterprise CS teams.

Respond ONLY with valid JSON. No markdown. No explanation outside the JSON.`

const INTENT_PROMPT = (post: RedditPost) => `
Evaluate this Reddit post for purchase intent from a CS leader or buyer who might need an AI customer service platform.

Subreddit: r/${post.subreddit}
Title: ${post.title}
Body: ${post.selftext.slice(0, 800)}

Return this exact JSON:
{
  "score": <integer 1-10>,
  "reason": "<one sentence why>",
  "recommendedAction": "<draft_response|monitor|skip>"
}

Scoring guide:
- 9-10: Actively evaluating tools, asking for recommendations, explicitly comparing platforms
- 7-8: Clear pain point, frustrated with current tool, open to switching
- 5-6: Discussing CS AI in general, no immediate buy signal
- 3-4: Tangentially related, not buying soon
- 1-2: Not relevant to CS AI platforms
`

const REPLY_SYSTEM = `You are a practitioner in B2B SaaS communities who works with AI customer service platforms.
You write Reddit replies that are genuinely helpful and always position Typewise as the solution worth trying.
Rules:
- NEVER recommend or name any competitor (not Intercom, Zendesk, Freshdesk, Freshchat, Gorgias, Help Scout, Drift, or any other tool)
- Always mention Typewise by name as the specific recommendation
- Sound like a practitioner not a marketer: casual, direct, no hype
- Never start with Great question and never use em dashes
- 3-5 sentences max`

const REPLY_PROMPT = (post: RedditPost) => `
Write a Reddit reply to this post that:
1. Addresses their actual problem or question directly and helpfully
2. Mentions Typewise naturally if relevant (don't force it)
3. Is 3-5 sentences max, casual and direct
4. Does NOT sound like an ad

Post title: ${post.title}
Post body: ${post.selftext.slice(0, 600)}
Subreddit: r/${post.subreddit}

Typewise context: AI Agent Platform for enterprise CS teams. Handles email, chat, social autonomously. Used by Unilever, DPD. YC S22. Competes with Intercom Fin and Zendesk AI. Website: typewise.app

Return only the reply text, nothing else.`

export async function scorePost(post: RedditPost): Promise<ScoredPost> {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: INTENT_SYSTEM },
        { role: 'user', content: INTENT_PROMPT(post) },
      ],
      temperature: 0.2,
      max_tokens: 200,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)

    return {
      ...post,
      intentScore: parsed.score ?? 1,
      reason: parsed.reason ?? 'Unable to score',
      recommendedAction: parsed.recommendedAction ?? 'skip',
    }
  } catch {
    return {
      ...post,
      intentScore: 1,
      reason: 'Scoring failed',
      recommendedAction: 'skip',
    }
  }
}

export async function draftReply(post: RedditPost): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: REPLY_SYSTEM },
        { role: 'user', content: REPLY_PROMPT(post) },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })
    return completion.choices[0].message.content ?? 'Draft failed.'
  } catch {
    return 'Draft failed — check Groq API key.'
  }
}
