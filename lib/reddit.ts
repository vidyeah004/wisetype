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
  'intercom',
  'zendesk',
  'freshdesk',
  'cs platform',
  'support tool',
  'helpdesk',
  'ai agent',
  'support automation',
  'ticket',
  'evaluating',
  'switching',
  'recommend',
  'cx platform',
  'live chat',
  'support software',
  'contact center',
]

const SUBREDDITS = [
  'CustomerSuccess',
  'SaaS',
  'customer_service',
  'helpdesk',
  'msp',
  'startups',
]

const SEARCH_QUERIES = [
  'customer service AI platform',
  'intercom alternative',
  'zendesk alternative',
  'customer support software',
]

// Uses Pullpush.io — a Reddit mirror API that works from any server
async function fetchFromPullpush(subreddit: string): Promise<RedditPost[]> {
  try {
    const url = `https://api.pullpush.io/reddit/submission/search/?subreddit=${subreddit}&size=25&sort=desc&sort_type=created_utc`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error(`Pullpush failed: ${res.status} for r/${subreddit}`)
      return []
    }
    const data = await res.json()
    return (data?.data ?? []).map((p: RedditPost & { full_link?: string }) => ({
      id: p.id,
      title: p.title ?? '',
      selftext: p.selftext ?? '',
      subreddit: p.subreddit ?? subreddit,
      url: p.url ?? '',
      score: p.score ?? 0,
      num_comments: p.num_comments ?? 0,
      created_utc: p.created_utc ?? 0,
      author: p.author ?? '',
      permalink: p.full_link ? p.full_link.replace('https://www.reddit.com', '') : `/r/${subreddit}`,
    }))
  } catch (err) {
    console.error(`Pullpush error for r/${subreddit}:`, err)
    return []
  }
}

async function searchPullpush(query: string): Promise<RedditPost[]> {
  try {
    const url = `https://api.pullpush.io/reddit/submission/search/?q=${encodeURIComponent(query)}&size=15&sort=desc&sort_type=created_utc`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error(`Pullpush search failed: ${res.status} for "${query}"`)
      return []
    }
    const data = await res.json()
    return (data?.data ?? []).map((p: RedditPost & { full_link?: string }) => ({
      id: p.id,
      title: p.title ?? '',
      selftext: p.selftext ?? '',
      subreddit: p.subreddit ?? '',
      url: p.url ?? '',
      score: p.score ?? 0,
      num_comments: p.num_comments ?? 0,
      created_utc: p.created_utc ?? 0,
      author: p.author ?? '',
      permalink: p.full_link ? p.full_link.replace('https://www.reddit.com', '') : '',
    }))
  } catch (err) {
    console.error(`Pullpush search error for "${query}":`, err)
    return []
  }
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  // Fetch subreddits + searches in parallel
  const [subredditResults, searchResults] = await Promise.all([
    Promise.all(SUBREDDITS.map(fetchFromPullpush)),
    Promise.all(SEARCH_QUERIES.map(searchPullpush)),
  ])

  const allPosts = [...subredditResults.flat(), ...searchResults.flat()]
  console.log(`Raw posts fetched: ${allPosts.length}`)

  // Deduplicate
  const seen = new Set<string>()
  const unique = allPosts.filter((p) => {
    if (!p.id || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  console.log(`After dedup: ${unique.length}`)

  // Keyword filter
  const filtered = unique.filter((post) => {
    const text = `${post.title} ${post.selftext}`.toLowerCase()
    return KEYWORDS.some((kw) => text.includes(kw))
  })
  console.log(`After keyword filter: ${filtered.length}`)

  return filtered
}
