import { useState } from 'react'
import { Search, ChevronDown, Flame, Loader2 } from 'lucide-react'
import { ROAST_STYLES } from '../utils/openai'

const STYLE_KEYS = Object.keys(ROAST_STYLES)

export default function RoastForm({ onSubmit, isLoading }) {
  const [username, setUsername] = useState('')
  const [style, setStyle] = useState('Classic')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return
    onSubmit(trimmed, style)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-6 sm:p-8 animate-slide-up"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Username input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            id="github-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub username…"
            autoComplete="off"
            spellCheck={false}
            disabled={isLoading}
            className="input-field pl-10"
          />
        </div>

        {/* Style dropdown */}
        <div className="relative sm:w-56">
          <select
            id="roast-style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            disabled={isLoading}
            className="select-field pr-10"
          >
            {STYLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {ROAST_STYLES[key].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        {/* Submit button */}
        <button
          id="roast-btn"
          type="submit"
          disabled={isLoading || !username.trim()}
          className="btn-primary sm:w-40 animate-pulse-glow"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Roasting…
            </>
          ) : (
            <>
              <Flame className="w-4 h-4" />
              Roast Me
            </>
          )}
        </button>
      </div>

      {/* Style description hint */}
      <p className="mt-3 text-xs text-gray-600 pl-1">
        Style:{' '}
        <span className="text-gray-500">
          {{
            Classic: 'Savage tech humour with developer in-jokes',
            Corporate: 'Passive-aggressive buzzword performance review',
            Pirate: 'Arr — nautical insults from the high seas',
            Haiku: 'Devastating 5-7-5 poetic destruction',
            Shakespearean: 'Elizabethan drama and tragic verse',
          }[style]}
        </span>
      </p>
    </form>
  )
}
