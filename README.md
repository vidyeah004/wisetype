# Typewise Radar

AI-powered Reddit monitoring that finds CS leaders actively evaluating customer service platforms — before they pick Intercom or Zendesk.

**Live demo:** [your-vercel-url.vercel.app]

---

## What it does

1. **Scans** 7 subreddits + targeted search queries for posts from CS buyers
2. **Scores** each post 1–10 for purchase intent using Groq (llama-3.3-70b)
3. **Flags** high-intent posts (score 7+) where Typewise should respond
4. **Drafts** contextual, non-spammy replies — human reviews before posting

Built as a demonstration for Typewise's AI Growth Engineer role. The system is designed to run at the scale of a full marketing team, operated by one person.

---

## Stack

- **Next.js 14** (App Router)
- **Groq** — llama-3.3-70b-versatile for intent scoring + reply drafting
- **Reddit public JSON API** — no auth required for read access
- **Vercel** — serverless deployment

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/typewise-radar
cd typewise-radar
npm install
```

### 2. Add environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add `GROQ_API_KEY` in Vercel → Project Settings → Environment Variables.

Or use the Vercel dashboard: import the GitHub repo, add the env var, deploy.

---

## How it works

### Reddit scanning (`lib/reddit.ts`)

Pulls latest posts from:
- r/CustomerSuccess
- r/SaaS
- r/customer_service
- r/msp
- r/helpdesk
- r/Intercom
- r/startups

Plus targeted searches for: "AI customer service platform recommendation", "Intercom alternative AI", "Zendesk alternative".

Pre-filters to keyword matches before sending to Groq — keeps API usage low.

### Intent scoring (`lib/groq.ts`)

Each post is scored 1–10:
- **9–10**: Actively evaluating tools, asking for recommendations
- **7–8**: Clear pain point, open to switching
- **5–6**: General discussion, no buy signal
- **1–4**: Not relevant

Posts scoring 7+ are flagged as `draft_response`. Posts 5–6 are `monitor`. Below 5 are `skip`.

### Reply drafting (`lib/groq.ts`)

Drafts are contextual and helpful first — Typewise is only mentioned when it fits naturally. Never auto-posted. Human reviews every draft before it goes live.

---

## Extending this

Things to build next:

- **Scheduled scans** — cron job via Vercel cron or n8n trigger every 30 mins
- **Slack/email alerts** — ping on every high-intent post in real time
- **G2/Capterra monitoring** — Scraper API to watch competitor reviews for switchers
- **Reply history** — track which posts were responded to, measure thread engagement
- **Multi-channel** — same pipeline for LinkedIn, Support Driven Slack, HackerNews

---

## Why this approach

CS buyers don't start on vendor websites. They start on Reddit asking "anyone using X, is it worth it?" or "we're evaluating Intercom alternatives". By the time they fill out a demo form, the decision is half-made.

This system finds them at the research stage — when a genuine, helpful response from someone who knows Typewise can actually change the outcome.

Paid search gets you when they're ready to buy. This gets you before they've decided who to buy from.
