const nextConfig = {
  async rewrites() {
    return [
      { source: '/skills', destination: '/api/skills' },
      { source: '/skills/teach', destination: '/api/skills/teach' },
      { source: '/skills/teach/:id', destination: '/api/skills/teach/:id' },
      { source: '/goals', destination: '/api/goals' },
      { source: '/goals/learn', destination: '/api/goals/learn' },
      { source: '/goals/learn/:id', destination: '/api/goals/learn/:id' },
    ]
  },
}

export default nextConfig