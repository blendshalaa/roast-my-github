import { useState, useRef, useCallback } from 'react'
import Header from './components/Header'
import RoastForm from './components/RoastForm'
import RoastOutput from './components/RoastOutput'
import ErrorMessage from './components/ErrorMessage'
import { fetchGitHubData } from './utils/github'
import { streamRoast } from './utils/openai'

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [roastText, setRoastText] = useState('')
  const [error, setError] = useState('')
  const [githubUser, setGithubUser] = useState(null)
  const [activeStyle, setActiveStyle] = useState('')
  const abortRef = useRef(null)

  const handleRoast = useCallback(async (username, style) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setError('')
    setRoastText('')
    setGithubUser(null)
    setActiveStyle(style)
    setIsLoading(true)

    try {
      // 1. Fetch GitHub data
      const { user, summary } = await fetchGitHubData(username)
      setGithubUser(user)
      setIsLoading(false)
      setIsStreaming(true)

      // 2. Stream the roast
      await streamRoast(
        summary,
        style,
        (chunk) => setRoastText((prev) => prev + chunk),
        abortRef.current.signal
      )
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [])

  function handleReset() {
    if (abortRef.current) abortRef.current.abort()
    setRoastText('')
    setError('')
    setGithubUser(null)
    setIsLoading(false)
    setIsStreaming(false)
  }

  const showOutput = roastText || isStreaming

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-brand-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-brand-500/4 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-16">
        {/* Header */}
        <Header />

        {/* Main content */}
        <main className="flex flex-col gap-5">
          {/* Form (always visible) */}
          {!showOutput && (
            <RoastForm onSubmit={handleRoast} isLoading={isLoading} />
          )}

          {/* Loading state (fetching GitHub data) */}
          {isLoading && (
            <div className="glass-card p-6 flex items-center gap-4 animate-fade-in">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-300">Fetching GitHub data…</p>
                <p className="text-xs text-gray-600 mt-0.5">Preparing the evidence</p>
              </div>
            </div>
          )}

          {/* Error */}
          <ErrorMessage message={error} onDismiss={() => setError('')} />

          {/* Roast output */}
          {showOutput && (
            <RoastOutput
              roastText={roastText}
              isStreaming={isStreaming}
              user={githubUser}
              style={activeStyle}
              onReset={handleReset}
            />
          )}

          {/* After stream ends, show form again for another roast */}
          {showOutput && !isStreaming && (
            <div className="animate-fade-in">
              <RoastForm onSubmit={handleRoast} isLoading={isLoading} />
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-gray-700">
        Built with GPT-4o &amp; the GitHub API · No repos were harmed in the making of this roast
      </footer>
    </div>
  )
}
