import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuthHook';
import { useLanguage } from '../../i18n/LanguageContext';
import { AuthPasswordField } from './AuthPasswordField';
import { AuthProfilePreview } from './AuthProfilePreview';
import './AuthPages.css';

const GoogleSignInButton = memo(function GoogleSignInButton({
  onSuccess
}: {
  onSuccess: (credentialResponse: CredentialResponse) => Promise<void>;
}) {
  return (
    <div className="auth-google">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => {
          // Error state is managed by the auth provider when the credential reaches the API.
        }}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
});

export function LoginPage() {
  const { loginWithGoogle, loginWithPassword, isAuthenticated, error, clearError, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      await loginWithPassword({ email, password });
      navigate('/');
    } catch {
      // Error state is managed by the auth provider.
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/');
    } catch {
      // Error state is managed by the auth provider.
    } finally {
      setSubmitting(false);
    }
  }, [clearError, loginWithGoogle, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthProfilePreview
          label={email || t('yourAccount')}
          title={t('loginCorner')}
        />
        <p className="auth-eyebrow">{t('welcomeBack')}</p>
        <h1>{t('signInTitle')}</h1>
        <p className="auth-copy">
          {t('loginCopy')}
        </p>

        <form className="auth-form" onSubmit={handlePasswordLogin}>
          <div className="auth-field">
            <label htmlFor="login-email">{t('email')}</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <AuthPasswordField
            id="login-password"
            label={t('password')}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <button className="auth-primary-button" type="submit" disabled={submitting || isLoading}>
            {submitting ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">{t('forgotPassword')}</Link>
          <Link to="/signup">{t('createAccount')}</Link>
        </div>

        <div className="auth-divider">
          <span>{t('orContinueWith')}</span>
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} />

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-footer">
          {t('newHere')} <Link to="/signup">{t('createYourAccount')}</Link>
        </div>
      </div>
    </div>
  );
}
