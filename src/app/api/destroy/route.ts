import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateChannelRepo } from '../../../channel'
import { error as logError } from '../../../log'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { slug } = await request.json()

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  // Anyone can destroy a channel if they know the slug. This enables a terms violation reporter to destroy the channel after they report it.

  try {
    await getOrCreateChannelRepo().destroyChannel(slug)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logError('Failed to destroy channel: %o', error)
    return NextResponse.json(
      { error: 'Failed to destroy channel' },
      { status: 500 },
    )
  }
}
