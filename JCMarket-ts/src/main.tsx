import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { LanguageProvider } from './i18n/LanguageContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '489109189204-ve0eov52ofm0apd69d9npo5vlbjld1ru.apps.googleusercontent.com';

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
