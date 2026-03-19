/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'src', 'pages', 'components', 'lib', 'context', 'hooks', 'types'],
  },
  reactStrictMode: true,
}

module.exports = nextConfig
