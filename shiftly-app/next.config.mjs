import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  },
}

export default withSentryConfig(nextConfig, {
  org:     'shiftly-saas',
  project: 'shiftly-app',
  silent:  !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps:        true,
  disableLogger:         true,
  automaticVercelMonitors: false,
})
