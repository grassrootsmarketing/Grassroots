import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const SLACK_TOKEN_GRASSROOTS = process.env.SLACK_TOKEN_GRASSROOTS!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const DIGEST_FILE = path.join(process.cwd(), 'data', 'slack-digest.json');

/**
 * POST /api/slack-digest/generate
 * Fetches last week's messages from Grassroots Marketing Slack, summarises via Claude,
 * and stores result in data/slack-digest.json
 */

/** Fetch all public channels in a workspace. */
async function listChannels(token: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch('https://slack.com/api/conversations.list?limit=200&exclude_archived=true', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: any = await res.json();
  if (!data.ok) throw new Error(`conversations.list: ${data.error}`);
  return (data.channels ?? []).map((c: any) => ({ id: c.id, name: c.name }));
}

/** Fetch messages posted after `oldest` (Unix seconds). Silently returns [] if not a member. */
async function fetchMessages(token: string, channelId: string, oldest: number): Promise<any[]> {
  const res = await fetch(
    `https://slack.com/api/conversations.history?channel=${channelId}&oldest=${oldest}&limit=200&exclude_archived=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data: any = await res.json();
  if (!data.ok) {
    if (['not_in_channel', 'channel_not_found'].includes(data.error)) return [];
    throw new Error(`conversations.history: ${data.error}`);
  }
  return data.messages ?? [];
}

export async function POST() {
  try {
    const channels = await listChannels(SLACK_TOKEN_GRASSROOTS);
    const oneWeekAgoUnix = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

    const channelData: { channelName: string; lines: string[] }[] = [];
    for (const ch of channels) {
      const raw = await fetchMessages(SLACK_TOKEN_GRASSROOTS, ch.id, oneWeekAgoUnix);
      if (!raw.length) continue;
      const lines = raw.map(
        (m: any) => `[${new Date(parseFloat(m.ts) * 1000).toLocaleString()}] ${m.user ?? 'bot'}: ${m.text ?? ''}`
      );
      channelData.push({ channelName: ch.name, lines });
    }

    if (!channelData.length) {
      return NextResponse.json({ error: 'No messages found in last week' }, { status: 404 });
    }

    // Build the prompt payload
    let payload = '=== Grassroots Marketing Slack ===\n\n';
    for (const ch of channelData) {
      payload += `--- #${ch.channelName} (${ch.lines.length} messages) ---\n`;
      payload += ch.lines.join('\n') + '\n\n';
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are generating a weekly Slack digest for a grassroots marketing business owner. Below are all messages posted last week across their company Slack workspace.

CRITICAL: Pay special attention to:
🚨 Product quality issues or concerns (flag these prominently)
❓ Staff questions (especially if unanswered)
⚠️ Customer complaints or feedback
📦 Supply/inventory requests

Tasks:
1. For each channel, create a structured brief:

**• PRODUCT QUALITY ALERTS:** (if any)
- List ANY mention of product issues, defects, customer complaints, or quality concerns
- Include who reported it, what product, and current status

**• STAFF QUESTIONS & CONCERNS:** (if any)
- List EVERY question asked by staff members
- Note if the question was answered or still pending
- Flag urgent/unanswered questions

**• SUPPLY REQUESTS:** (if any)
- List EVERY INDIVIDUAL supply request (do not summarize)
- Format: [Person] requested [specific item/quantity] for [reason] - Status: [approved/pending/needed by date]

**• KEY UPDATES:**
- Major developments, launches, or milestones
- Schedule changes or important announcements

**• DECISIONS MADE:**
- What was decided, by whom, and why

**• ACTION ITEMS:**
- Who needs to do what by when
- Flag overdue or urgent items

**• AMBIGUOUS/UNCLEAR ITEMS:**
- Messages that seem important but lack clarity
- Your interpretation with context: "This appears to mean..."
- Suggest what follow-up might be needed

2. Create an EXECUTIVE SUMMARY with:
**🚨 IMMEDIATE ATTENTION REQUIRED:**
- Product quality issues
- Unanswered staff questions
- Customer problems
- Urgent supply needs

**📊 WEEK IN REVIEW:**
- Top 3-5 most important items
- Strategic insights or patterns

Be specific: use names, dates, product names, quantities. Don't gloss over details.
For ambiguous messages, provide your best interpretation with context clues.

Respond with ONLY valid JSON — no markdown fences, no preamble. Use this exact structure:

{
  "overallSummary": "...",
  "channels": [
    {
      "channelName": "exact-channel-name",
      "workspace": "Grassroots Marketing",
      "messageCount": <number>,
      "summary": "..."
    }
  ]
}

Messages:

${payload}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No text in Claude response' }, { status: 500 });
    }

    let cleanText = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);

    const digest = {
      generatedAt: new Date().toISOString(),
      totalMessages: channelData.reduce((sum, ch) => sum + ch.lines.length, 0),
      overallSummary: parsed.overallSummary || '',
      channels: parsed.channels || [],
    };

    const dataDir = path.dirname(DIGEST_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(DIGEST_FILE, JSON.stringify(digest, null, 2), 'utf-8');

    return NextResponse.json({ success: true, digest });
  } catch (error: any) {
    console.error('Generate digest error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
