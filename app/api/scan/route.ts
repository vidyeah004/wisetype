import { NextResponse } from 'next/server'
import { fetchRedditPosts } from '@/lib/reddit'
import { scorePost } from '@/lib/groq'

export const maxDuration = 60

export async function GET() {
  try {
    const posts = await fetchRedditPosts()
    console.log(`Fetched ${posts.length} posts after keyword filter`)

    if (posts.length === 0) {
      return NextResponse.json({ posts: [], total: 0, warning: 'No posts matched keyword filter' })
    }

    const scored = await Promise.all(posts.map((p) => scorePost(p)))
    scored.sort((a, b) => b.intentScore - a.intentScore)

    return NextResponse.json({ posts: scored, total: scored.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Scan error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
