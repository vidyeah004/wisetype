import { NextRequest, NextResponse } from 'next/server'
import { draftReply } from '@/lib/groq'
import { RedditPost } from '@/lib/reddit'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const post: RedditPost = await req.json()
    const reply = await draftReply(post)
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Draft failed' }, { status: 500 })
  }
}
