import { Flame, GitBranch } from 'lucide-react'

export default function Header() {
  return (
    <header className="text-center py-12 px-4 animate-fade-in">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-1.5 mb-6">
        <Flame className="w-4 h-4 text-brand-400" />
        <span className="text-brand-300 text-sm font-medium tracking-wide">Powered by GPT-4o</span>
      </div>

      {/* Title */}
      <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
        <span className="text-white">Roast My</span>{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600 neon-text">
          GitHub
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
        Enter a GitHub username and let AI tear apart their repos with
        <span className="text-brand-400 font-medium"> zero mercy</span>.
      </p>

      {/* Decorative separator */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-brand-500/40" />
        <GitBranch className="w-5 h-5 text-gray-600" />
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-brand-500/40" />
      </div>
    </header>
  )
}
