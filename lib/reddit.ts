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

const KEYWORDS = [
  'customer service',
  'customer support',
  'ai support',
  'intercom alternative',
  'zendesk alternative',
  'cs platform',
  'support tool',
  'helpdesk',
  'ai agent',
  'support automation',
  'ticket automation',
  'customer service ai',
  'evaluating',
  'switching from',
  'what are you using',
  'recommend',
  'cx platform',
  'live chat',
  'support software',
]

// Subreddit RSS feeds — no auth, no blocking
const SUBREDDIT_FEEDS = [
  'https://www.reddit.com/r/CustomerSuccess/new.json?limit=25&raw_json=1',
  'https://www.reddit.com/r/SaaS/new.json?limit=25&raw_json=1',
  'https://www.reddit.com/r/customer_service/new.json?limit=25&raw_json=1',
  'https://www.reddit.com/r/helpdesk/new.json?limit=25&raw_json=1',
  'https://www.reddit.com/r/msp/new.json?limit=25&raw_json=1',
  'https://www.reddit.com/r/startups/new.json?limit=25&raw_json=1',
]

// Targeted search URLs — hits Reddit's search directly
const SEARCH_FEEDS = [
  'https://www.reddit.com/search.json?q=customer+service+AI+platform&sort=new&limit=15&raw_json=1',
  'https://www.reddit.com/search.json?q=intercom+alternative&sort=new&limit=15&raw_json=1',
  'https://www.reddit.com/search.json?q=zendesk+alternative&sort=new&limit=15&raw_json=1',
  'https://www.reddit.com/search.json?q=customer+support+software+recommendation&sort=new&limit=15&raw_json=1',
]

// Rotate user agents to avoid blocks
const USER_AGENTS = [
  'Mozilla/5.0 (compatible; TypewiseRadar/1.0; research tool)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

async function fetchFeed(url: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'application/json',
      },
      // No cache — always fresh
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(`Feed fetch failed: ${res.status} for ${url}`)
      return []
    }

    const data = await res.json()
    const children = data?.data?.children ?? []

    return children.map((c: { data: RedditPost }) => ({
      id: c.data.id,
      title: c.data.title ?? '',
      selftext: c.data.selftext ?? '',
      subreddit: c.data.subreddit ?? '',
      url: c.data.url ?? '',
      score: c.data.score ?? 0,
      num_comments: c.data.num_comments ?? 0,
      created_utc: c.data.created_utc ?? 0,
      author: c.data.author ?? '',
      permalink: c.data.permalink ?? '',
    }))
  } catch (err) {
    console.error(`Feed error for ${url}:`, err)
    return []
  }
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const allUrls = [...SUBREDDIT_FEEDS, ...SEARCH_FEEDS]

  // Fetch all feeds in parallel
  const results = await Promise.all(allUrls.map(fetchFeed))
  const allPosts = results.flat()

  console.log(`Raw posts fetched: ${allPosts.length}`)

  // Deduplicate by id
  const seen = new Set<string>()
  const unique = allPosts.filter((p) => {
    if (!p.id || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  console.log(`After dedup: ${unique.length}`)

  // Keyword filter — loosened to catch more
  const filtered = unique.filter((post) => {
    const text = `${post.title} ${post.selftext}`.toLowerCase()
    return KEYWORDS.some((kw) => text.includes(kw))
  })

  console.log(`After keyword filter: ${filtered.length}`)

  return filtered
}
