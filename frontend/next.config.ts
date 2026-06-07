const nextConfig = {
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/signup', destination: '/signup', permanent: true },
      { source: '/mobile-signin', destination: '/mobile-signin.html', permanent: false },
    ]
  },
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