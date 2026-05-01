import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: [['babel-plugin-react-compiler', { target: '19' }]],
    },
  })],
  server:{ 
    proxy:{
      '/api':{
        target: 'https://api.render.com/deploy/srv-d77857gule4c73f5kgbg?key=rvkpiSHWJDM'
      }, 
      
      '/images':{
        target: 'https://api.render.com/deploy/srv-d77857gule4c73f5kgbg?key=rvkpiSHWJDM'
      }
    }
  }
})
