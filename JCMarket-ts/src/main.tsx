import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { LanguageProvider } from './i18n/LanguageContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <HashRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </HashRouter>
  </GoogleOAuthProvider>,
)
