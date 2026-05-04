import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const backendTarget = (
    env.VITE_API_PROXY_TARGET
    || env.VITE_API_URL
    || env.VITE_API_BASE_URL
    || 'http://localhost:3000'
  ).replace(/\/+$/, '')

  return {
    plugins: [react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    })],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },

        '/images': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
