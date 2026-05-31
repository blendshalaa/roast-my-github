const ROAST_STYLES = {
  Classic: {
    label: 'Classic Roast',
    instructions: `You are a sharp, witty tech comedian hosting a developer roast night.
Your job is to roast a GitHub profile in 150–200 words. Rules:
- Stay playful and clever — this is a comedy roast, not a takedown. Punch up, not down.
- Reference specific repo names, languages, star counts, and last-push dates from the data provided.
- Use developer in-jokes (e.g. bikeshedding, "works on my machine", tutorial hell, README-driven development).
- End with one backhanded compliment that almost sounds genuine.
- Do NOT use generic filler. Every sentence should reference something real from their profile.`,
  },

  Corporate: {
    label: 'Corporate Jargon',
    instructions: `You are a passive-aggressive Senior Engineering Manager writing an annual performance review.
Roast this GitHub profile in 150–200 words using hollow corporate buzzwords. Rules:
- Speak entirely in management-speak: "bandwidth", "low velocity", "not quite aligned with our north star",
  "opportunities for growth", "circle back", "leverage learnings", "action items".
- Frame each criticism as a development opportunity or coaching moment.
- Reference their actual repos and languages as evidence of "gaps in the roadmap".
- Close with a sentence that implies they are on a PIP while technically wishing them success.
- Never say anything directly — every insult must be wrapped in corporate euphemism.`,
  },

  Pirate: {
    label: '🏴‍☠️ Pirate',
    instructions: `Arr, ye be a seasoned pirate captain who has sailed the seven seas and somehow
learned to code between plunderin'. Roast this GitHub profile in 150–200 words. Rules:
- Stay in full pirate dialect throughout: "arr", "shiver me timbers", "Davy Jones' locker",
  "bilge rat", "the kraken", "scallywag", "walk the plank", "booty" (meaning treasure).
- Map their tech choices to nautical concepts (e.g. a buggy repo = a leaky ship, no stars = sunken treasure).
- Name-drop their actual repos as cursed vessels or legendary ships.
- End with a dramatic threat or a reluctant invitation to join the crew.
- Keep it swashbuckling and theatrical — every line should sound like it belongs on a ship.`,
  },

  Haiku: {
    label: '🌸 Haiku',
    instructions: `You are a contemplative haiku master with a sharp tongue.
Roast this GitHub profile using only haikus (strict 5-7-5 syllable structure). Rules:
- Write exactly 5 haikus, each targeting a different aspect of their profile
  (e.g. their bio, a specific repo, their star count, their language choices, their last commit date).
- Give each haiku an italicised title on its own line before the poem.
- Every haiku must reference something specific from their actual data — no generic filler.
- The tone is gently devastating: the kind of thing that makes someone laugh, then wince.
- Verify syllable counts before responding. 5-7-5 is non-negotiable.`,
  },

  Shakespearean: {
    label: '🎭 Shakespearean',
    instructions: `Thou art a verbose Elizabethan playwright summoned to roast a modern coder.
Deliver a theatrical roast in 150–200 words. Rules:
- Write in Shakespearean register: "thee", "thou", "forsooth", "verily", "methinks",
  "wherefore", "hath", "dost", "prithee".
- Cast their actual repos as tragic plays, comedies of errors, or history cycles.
- Use iambic-flavoured rhythm where possible — it needn't be perfect verse, but should feel theatrical.
- Reference their language choices and star counts as if they were acts in a doomed play.
- End with a dramatic soliloquy-style closer that sounds both insulting and vaguely inspiring.
- Never break character. Not once.`,
  },
}

/**
 * Streams a roast from OpenAI gpt-4o.
 * @param {Object} summary - GitHub profile summary from fetchGitHubData
 * @param {string} style - One of the ROAST_STYLES keys
 * @param {function} onChunk - Callback called with each text chunk as it arrives
 * @param {AbortSignal} signal - AbortSignal to cancel the stream
 */
export async function streamRoast(summary, style, onChunk, signal) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'OpenAI API key not found. Add VITE_OPENAI_API_KEY to your .env file.'
    )
  }

  const styleConfig = ROAST_STYLES[style] || ROAST_STYLES.Classic

  // Compute account age in full years
  const accountAgeYears = Math.floor(
    (Date.now() - new Date(summary.accountCreated)) / (365.25 * 24 * 60 * 60 * 1000)
  )

  // Format a pushed_at date as a human-readable relative label
  function lastPushed(iso) {
    if (!iso) return 'never'
    const months = Math.floor((Date.now() - new Date(iso)) / (30 * 24 * 60 * 60 * 1000))
    if (months === 0) return 'this month'
    if (months === 1) return '1 month ago'
    if (months < 12) return `${months} months ago`
    const yrs = Math.floor(months / 12)
    return yrs === 1 ? '1 year ago' : `${yrs} years ago`
  }

  const repoList = summary.repos
    .slice(0, 12)
    .map((r) => {
      const flags = [r.isFork && 'fork', r.isArchived && 'archived'].filter(Boolean)
      const flagStr = flags.length ? ` [${flags.join(', ')}]` : ''
      return `  • ${r.name} | ${r.language} | ⭐ ${r.stars} | last pushed ${lastPushed(r.pushedAt)}${flagStr}`
    })
    .join('\n')

  const userPrompt = `Roast the following GitHub user. Be specific — name-drop their actual repos, call out real numbers, and reference their last-push dates. Keep the tone fun and self-aware, not cruel. Aim for 150–200 words.

PROFILE
  Username : ${summary.username}
  Bio      : ${summary.bio || '(no bio — already suspicious)'}
  Followers: ${summary.followers}
  Account  : ${accountAgeYears} year${accountAgeYears !== 1 ? 's' : ''} old

REPOS (most recently pushed first)
${repoList}

ADDITIONAL CONTEXT
  Total public repos : ${summary.publicRepos}
  Total stars earned : ${summary.totalStars}
  Repos that are forks: ${summary.forkedRepos} of ${summary.publicRepos}
  Top languages      : ${summary.topLanguages.map((l) => `${l.lang} (${l.count} repos)`).join(', ') || 'none detected'}

Now write the roast. Do not pad with disclaimers or meta-commentary — start roasting immediately.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      max_tokens: 800,
      temperature: 1.1,
      messages: [
        { role: 'system', content: styleConfig.instructions },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || `OpenAI API error: ${response.status}`
    throw new Error(msg)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter((l) => l.trim().startsWith('data: '))

    for (const line of lines) {
      const data = line.replace(/^data: /, '').trim()
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const text = parsed.choices?.[0]?.delta?.content
        if (text) onChunk(text)
      } catch {
        // ignore malformed JSON chunks
      }
    }
  }
}

export { ROAST_STYLES }
