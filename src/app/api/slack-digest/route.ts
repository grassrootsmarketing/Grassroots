import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DIGEST_FILE = path.join(process.cwd(), 'data', 'slack-digest.json');

export async function GET() {
  try {
    if (!fs.existsSync(DIGEST_FILE)) {
      return NextResponse.json({ error: 'No digest found' }, { status: 404 });
    }
    const content = fs.readFileSync(DIGEST_FILE, 'utf-8');
    const digest = JSON.parse(content);
    return NextResponse.json(digest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
