import { useRef, useEffect, useState } from 'react'
import {
  Copy, Check, RefreshCw, ExternalLink,
  Star, Users, AlertCircle, Flame,
} from 'lucide-react'

// ─── Cycling loader messages ────────────────────────────────────────────────
const LOADING_MESSAGES = [
  'Fetching your repos…',
  'Reading your commit shame…',
  'Preparing the roast…',
]

function useCyclingMessage(active) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!active) { setIdx(0); return }
    const id = setInterval(() => setIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1500)
    return () => clearInterval(id)
  }, [active])

  return LOADING_MESSAGES[idx]
}

// ─── Style badge ─────────────────────────────────────────────────────────────
const STYLE_EMOJI = {
  Classic: '🔥', Corporate: '💼', Pirate: '🏴‍☠️', Haiku: '🌸', Shakespearean: '🎭',
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function RoastOutput({ status, roastText, errorMsg, user, style, onReset }) {
  const [copied, setCopied] = useState(false)
  const bottomRef  = useRef(null)
  const loadingMsg = useCyclingMessage(status === 'loading')

  // Auto-scroll while streaming
  useEffect(() => {
    if (status === 'streaming') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [roastText, status])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roastText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  // ── Shared card shell ────────────────────────────────────────────────────
  return (
    <div className="glass-card overflow-hidden animate-fade-in">

      {/* ── Terminal chrome ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs text-gray-600 font-mono">roast_output.txt</span>
        </div>

        {/* Actions — only when there's something to act on */}
        <div className="flex items-center gap-1">
          {(status === 'done') && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300
                         transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
          )}
          {(status === 'done' || status === 'error') && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300
                         transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New roast
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 sm:p-6 min-h-[140px] flex flex-col justify-center">

        {/* IDLE — empty state */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-3 py-4 select-none">
            <Flame className="w-8 h-8 text-gray-800" />
            <p className="text-gray-700 text-sm font-mono text-center leading-relaxed">
              Your roast will appear here…
            </p>
          </div>
        )}

        {/* LOADING — cycling messages */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-4 animate-fade-in">
            {/* Spinner */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-gray-800" />
              <div className="absolute inset-0 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
            {/* Cycling text */}
            <p
              key={loadingMsg}             /* key forces re-mount → triggers CSS fade */
              className="text-sm font-mono text-gray-400 animate-fade-in"
            >
              {loadingMsg}
            </p>
          </div>
        )}

        {/* STREAMING or DONE — roast text */}
        {(status === 'streaming' || status === 'done') && (
          <>
            {/* Profile strip */}
            {user && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800/60">
                <img
                  src={user.avatar_url}
                  alt={`${user.login}'s avatar`}
                  className="w-10 h-10 rounded-full ring-2 ring-brand-500/40 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm truncate">
                      {user.name || user.login}
                    </span>
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      @{user.login}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />{user.public_repos} repos
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{user.followers} followers
                    </span>
                  </div>
                </div>
                {style && (
                  <span className="flex-shrink-0 text-xs bg-brand-500/15 border border-brand-500/30 text-brand-300 rounded-full px-3 py-1">
                    {STYLE_EMOJI[style]} {style}
                  </span>
                )}
              </div>
            )}

            {/* Roast text */}
            <p className="roast-text whitespace-pre-wrap">
              {roastText}
              {status === 'streaming' && <span className="cursor-blink" aria-hidden="true" />}
            </p>
            <div ref={bottomRef} />
          </>
        )}

        {/* ERROR state */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 py-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm font-medium text-red-300 text-center">{errorMsg}</p>
          </div>
        )}

      </div>
    </div>
  )
}
