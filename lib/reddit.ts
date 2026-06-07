export interface RedditPost {
  id: string
  title: string
  selftext: string
  subreddit: string
  url: string
  score: number
  num_comments: number
  created_utc: number
  author: string
  permalink: string
}

export interface ScoredPost extends RedditPost {
  intentScore: number
  reason: string
  recommendedAction: 'draft_response' | 'monitor' | 'skip'
  draftedReply?: string
}

const SUBREDDITS = [
  'CustomerSuccess',
  'SaaS',
  'customer_service',
  'msp',
  'helpdesk',
  'Intercom',
  'startups',
]

const SEARCH_QUERIES = [
  'AI customer service platform recommendation',
  'Intercom alternative',
  'Zendesk alternative',
  'customer support AI tool',
]

const KEYWORDS = [
  'customer service',
  'customer support',
  'AI support',
  'intercom alternative',
  'zendesk alternative',
  'cs platform',
  'support tool',
  'helpdesk ai',
  'ai agent',
  'support automation',
  'ticket automation',
  'customer service ai',
  'evaluating',
  'switching from',
  'recommendation',
]

// Get a Reddit OAuth access token using app-only auth (no user login needed)
async function getRedditToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET env vars')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'TypewiseRadar/1.0 by u/typewise_radar',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Reddit OAuth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

async function redditFetch(token: string, path: string): Promise<RedditPost[]> {
  const res = await fetch(`https://oauth.reddit.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'TypewiseRadar/1.0 by u/typewise_radar',
    },
  })

  if (!res.ok) {
    console.error(`Reddit fetch failed: ${res.status} for ${path}`)
    return []
  }

  const data = await res.json()
  return (data?.data?.children ?? []).map((c: { data: RedditPost }) => c.data)
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const token = await getRedditToken()
  const allPosts: RedditPost[] = []

  // Fetch new posts from each subreddit
  for (const sub of SUBREDDITS) {
    const posts = await redditFetch(token, `/r/${sub}/new?limit=25`)
    allPosts.push(...posts)
  }

  // Search for high-intent queries
  for (const q of SEARCH_QUERIES) {
    const posts = await redditFetch(
      token,
      `/search?q=${encodeURIComponent(q)}&sort=new&limit=10&type=link`
    )
    allPosts.push(...posts)
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = allPosts.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  // Keyword filter
  return unique.filter((post) => {
    const text = `${post.title} ${post.selftext}`.toLowerCase()
    return KEYWORDS.some((kw) => text.includes(kw))
  })
}
