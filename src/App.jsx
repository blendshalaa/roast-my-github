import { useState, useRef, useCallback } from 'react'
import Header from './components/Header'
import RoastForm from './components/RoastForm'
import RoastOutput from './components/RoastOutput'
import { fetchGitHubData } from './utils/github'
import { streamRoast } from './utils/openai'

// status machine: idle → loading → streaming → done  (or → error at any point)
export default function App() {
  const [status, setStatus]       = useState('idle')   // idle | loading | streaming | done | error
  const [roastText, setRoastText] = useState('')
  const [errorMsg, setErrorMsg]   = useState('')
  const [githubUser, setGithubUser] = useState(null)
  const [activeStyle, setActiveStyle] = useState('')
  const abortRef    = useRef(null)
  const firstChunk  = useRef(false)

  const handleRoast = useCallback(async (username, style) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    firstChunk.current = false

    setStatus('loading')
    setRoastText('')
    setErrorMsg('')
    setGithubUser(null)
    setActiveStyle(style)

    try {
      // Phase 1 — fetch GitHub data (cycling loader shows here)
      const { user, summary } = await fetchGitHubData(username)
      setGithubUser(user)

      // Phase 2 — stream roast (loader keeps showing until first token)
      await streamRoast(
        summary,
        style,
        (chunk) => {
          // Transition to streaming on first token
          if (!firstChunk.current) {
            firstChunk.current = true
            setStatus('streaming')
          }
          setRoastText((prev) => prev + chunk)
        },
        abortRef.current.signal
      )

      setStatus('done')
    } catch (err) {
      if (err.name === 'AbortError') return

      const friendlyMsg = err.code === 'USER_NOT_FOUND'
        ? "Never heard of them. Try a real username."
        : "Something went wrong. Try again."

      setErrorMsg(friendlyMsg)
      setStatus('error')
    }
  }, [])

  function handleReset() {
    if (abortRef.current) abortRef.current.abort()
    setStatus('idle')
    setRoastText('')
    setErrorMsg('')
    setGithubUser(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-brand-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-brand-500/4 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-16">
        <Header />

        <main className="flex flex-col gap-5">
          {/* Form — always visible */}
          <RoastForm
            onSubmit={handleRoast}
            isLoading={status === 'loading' || status === 'streaming'}
          />

          {/* Output panel — always visible, switches between idle/loading/streaming/done/error */}
          <RoastOutput
            status={status}
            roastText={roastText}
            errorMsg={errorMsg}
            user={githubUser}
            style={activeStyle}
            onReset={handleReset}
          />
        </main>
      </div>

      <footer className="relative z-10 text-center py-6 text-xs text-gray-700">
        Built with GPT-4o &amp; the GitHub API · No repos were harmed in the making of this roast
      </footer>
    </div>
  )
}
