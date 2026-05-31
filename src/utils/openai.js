const ROAST_STYLES = {
  Classic: {
    label: 'Classic Roast',
    instructions: `You are a savage but witty tech roast comedian. 
Roast this GitHub profile with sharp, clever humour. Be brutal about their code choices, repo names, 
commit habits, and tech stack. Use developer in-jokes. No mercy, but keep it playful.`,
  },
  Corporate: {
    label: 'Corporate Jargon',
    instructions: `You are a passive-aggressive corporate manager who communicates entirely in 
hollow business buzzwords. Roast this GitHub profile as if writing a performance review, 
using phrases like "synergizing deliverables", "low code velocity", "not quite aligned with our north star metric". 
Make it hilariously corporate and devastating.`,
  },
  Pirate: {
    label: '🏴‍☠️ Pirate',
    instructions: `Arr, ye be a salty sea pirate who has somehow learned to code. 
Roast this GitHub profile in full pirate dialect — "arr", "shiver me timbers", "Davy Jones' locker", 
"bilge rat code", etc. Make it dramatic, nautical, and mercilessly funny.`,
  },
  Haiku: {
    label: '🌸 Haiku',
    instructions: `You are a contemplative haiku master. Roast this GitHub profile using only haikus 
(5-7-5 syllable structure). Write 4–6 haikus, each targeting a different embarrassing aspect of their profile. 
Label each haiku with a witty title. Make them devastating in their brevity.`,
  },
  Shakespearean: {
    label: '🎭 Shakespearean',
    instructions: `Thou art a Elizabethan playwright tasked with composing a theatrical roast. 
Roast this GitHub profile in the style of Shakespeare — use "thee", "thou", "forsooth", 
"verily", iambic flair, and dramatic metaphors. Reference their repos as tragic plays or comedies of errors.`,
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

  const userPrompt = `Here is the GitHub profile data to roast:

**Username:** ${summary.username}
**Name:** ${summary.name}
**Bio:** ${summary.bio}
**Account Created:** ${new Date(summary.accountCreated).toLocaleDateString()}
**Location:** ${summary.location}
**Public Repos:** ${summary.publicRepos}
**Followers:** ${summary.followers} | **Following:** ${summary.following}
**Total Stars:** ${summary.totalStars} | **Total Forks:** ${summary.totalForks}
**Forked Repos:** ${summary.forkedRepos} out of ${summary.publicRepos}
**Archived Repos:** ${summary.archivedRepos}
**Top Languages:** ${summary.topLanguages.map((l) => `${l.lang} (${l.count} repos)`).join(', ') || 'None'}

**Recent Repos:**
${summary.repos
  .slice(0, 15)
  .map(
    (r) =>
      `- **${r.name}** (${r.language || 'no language'}) — ⭐ ${r.stars}, 🍴 ${r.forks}${r.isFork ? ' [FORK]' : ''}${r.isArchived ? ' [ARCHIVED]' : ''}${r.description ? ` — "${r.description}"` : ''}`
  )
  .join('\n')}

Now roast them. Be specific — reference actual repo names, languages, and numbers. Make it personal.`

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
