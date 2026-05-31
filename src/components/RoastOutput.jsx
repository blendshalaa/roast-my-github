import { useRef, useEffect } from 'react'
import { Copy, Check, RefreshCw, ExternalLink, Star, GitFork, Users } from 'lucide-react'
import { useState } from 'react'

export default function RoastOutput({ roastText, isStreaming, user, style, onReset }) {
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll as text streams in
  useEffect(() => {
    if (isStreaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [roastText, isStreaming])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roastText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  if (!roastText && !isStreaming) return null

  const styleEmoji = {
    Classic: '🔥',
    Corporate: '💼',
    Pirate: '🏴‍☠️',
    Haiku: '🌸',
    Shakespearean: '🎭',
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* User profile strip */}
      {user && (
        <div className="glass-card p-4 flex items-center gap-4">
          <img
            src={user.avatar_url}
            alt={`${user.login}'s avatar`}
            className="w-12 h-12 rounded-full ring-2 ring-brand-500/40"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white truncate">{user.name || user.login}</span>
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
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {user.public_repos} repos
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {user.followers} followers
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3 h-3" />
                {user.following} following
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs bg-brand-500/15 border border-brand-500/30 text-brand-300 rounded-full px-3 py-1">
              {styleEmoji[style]} {style}
            </span>
          </div>
        </div>
      )}

      {/* Roast card */}
      <div className="glass-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-600 font-mono">roast_output.txt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!roastText || isStreaming}
              title="Copy roast"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-30
                         transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
              ) : (
                <><Copy className="w-3.5 h-3.5" />Copy</>
              )}
            </button>
            <button
              onClick={onReset}
              title="New roast"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300
                         transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Roast
            </button>
          </div>
        </div>

        {/* Roast text */}
        <div className="p-5 sm:p-6 min-h-[120px]">
          {roastText ? (
            <p className="roast-text whitespace-pre-wrap">
              {roastText}
              {isStreaming && <span className="cursor-blink" aria-hidden="true" />}
            </p>
          ) : (
            <div className="flex items-center gap-3 text-gray-600">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm font-mono">Generating roast…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
