import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a coffee expert analyzing coffee bag images for a coffee archiving app called Ground Up.

Extract all visible information from the coffee bag and return it as a single JSON object with these fields:
- roaster_name: string (the roastery/company name)
- coffee_name: string (the specific coffee name or blend)
- origin_country: string or null (country of origin)
- region: string or null (specific region/area)
- farm: string or null (farm name if visible)
- varietal: string or null (coffee variety e.g. Gesha, Bourbon, SL28)
- process: "washed" | "natural" | "honey" | "anaerobic" | "wet_hulled" | "other" | null
- roast_date: string or null (ISO date format YYYY-MM-DD, infer year if not shown)
- roast_level: "light" | "medium_light" | "medium" | "medium_dark" | "dark" | null
- roaster_taste_notes: string[] (flavor descriptors listed on the bag, lowercase, max 8)
- roaster_acidity: number (0-10 score inferred from taste notes and roast — 0=none, 10=very bright)
- roaster_fruit: number (0-10, how fruity/berry/citrus based on notes)
- roaster_body: number (0-10, 0=tea-like, 10=heavy/syrupy)
- roaster_roast: number (0-10, 0=very light/green, 10=very dark/burnt)
- roaster_sweetness: number (0-10, inferred from notes like chocolate, caramel, honey)
- roaster_floral: number (0-10, based on floral/jasmine/rose notes)
- roaster_finish: number (0-10, inferred from notes about aftertaste/finish)

Be generous with inference — use the taste notes, origin, process, and roast level to infer the flavor axes even if they aren't scored on the bag. Natural process coffees from Ethiopia tend to be more floral/fruity. Washed coffees tend toward higher acidity and cleaner finish.

Return ONLY the JSON object, no markdown, no explanation.`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Extract all coffee information from this bag image and return the JSON object.',
            },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip any accidental markdown fences
    const json = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const data = JSON.parse(json)

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[enrich-bag]', err)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
