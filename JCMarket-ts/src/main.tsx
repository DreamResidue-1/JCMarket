import { HashRouter } from 'react-router'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { LanguageProvider } from './i18n/LanguageContext'

const defaultGoogleClientId = '489109189204-q3v366mm8ed5sht13bn7ra7vpqf1ujtn.apps.googleusercontent.com';

const getGoogleClientId = () => {
  const candidateValues = [
    import.meta.env.VITE_GOOGLE_CLIENT_ID,
    import.meta.env.VITE_GOOGLE_CLIENT_IDS?.split(',')[0],
    import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
    defaultGoogleClientId
  ];

  for (const value of candidateValues) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const googleClientId = getGoogleClientId();

if (!googleClientId) {
  console.error('Google OAuth client ID is missing.');
}

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
