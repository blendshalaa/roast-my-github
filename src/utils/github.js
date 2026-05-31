/**
 * Fetches public repos and user profile from the GitHub API.
 * Throws descriptive errors for common failure cases.
 */
export async function fetchGitHubData(username) {
  const headers = {}
  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Fetch user profile
  const userRes = await fetch(`https://api.github.com/users/${username}`, { headers })

  if (userRes.status === 404) {
    const err = new Error(`No GitHub user found for "${username}".`)
    err.code = 'USER_NOT_FOUND'
    throw err
  }
  if (userRes.status === 403) {
    const err = new Error('GitHub API rate limit exceeded. Add VITE_GITHUB_TOKEN to your .env.')
    err.code = 'RATE_LIMITED'
    throw err
  }
  if (!userRes.ok) {
    const err = new Error(`GitHub API error: ${userRes.status} ${userRes.statusText}`)
    err.code = 'GITHUB_ERROR'
    throw err
  }

  const user = await userRes.json()

  if (user.type === 'Organization') {
    throw new Error(`"${username}" is an organization, not a user. Enter an individual's username.`)
  }

  // Fetch up to 100 public repos sorted by most recently updated
  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers }
  )

  if (!reposRes.ok) {
    throw new Error(`Failed to fetch repos: ${reposRes.status} ${reposRes.statusText}`)
  }

  const repos = await reposRes.json()

  // Build a summary object to send to OpenAI
  const summary = {
    username: user.login,
    name: user.name || user.login,
    bio: user.bio || 'No bio provided',
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    accountCreated: user.created_at,
    location: user.location || 'Unknown',
    hireable: user.hireable,
    repos: repos.slice(0, 30).map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.language || 'None',
      stars: r.stargazers_count,
      forks: r.forks_count,
      topics: r.topics || [],
      pushedAt: r.pushed_at,
      isFork: r.fork,
      isArchived: r.archived,
      openIssues: r.open_issues_count,
    })),
    topLanguages: getTopLanguages(repos),
    totalStars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
    totalForks: repos.reduce((sum, r) => sum + r.forks_count, 0),
    forkedRepos: repos.filter((r) => r.fork).length,
    archivedRepos: repos.filter((r) => r.archived).length,
  }

  return { user, summary }
}

function getTopLanguages(repos) {
  const counts = {}
  repos.forEach((r) => {
    if (r.language) counts[r.language] = (counts[r.language] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => ({ lang, count }))
}
