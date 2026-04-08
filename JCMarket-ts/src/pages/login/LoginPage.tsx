import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuthHook';
import { AuthPasswordField } from './AuthPasswordField';
import { AuthProfilePreview } from './AuthProfilePreview';
import './AuthPages.css';

export function LoginPage() {
  const { loginWithGoogle, loginWithPassword, isAuthenticated, error, clearError, isLoading } = useAuth();
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
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
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthProfilePreview
          label={email || 'Your account'}
          title="Login corner"
        />
        <p className="auth-eyebrow">Welcome Back</p>
        <h1>Sign in</h1>
        <p className="auth-copy">
          Use your email and password, or continue with Google below.
        </p>

        <form className="auth-form" onSubmit={handlePasswordLogin}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
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
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <button className="auth-primary-button" type="submit" disabled={submitting || isLoading}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>

        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        <div className="auth-google">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              // Error state is managed by the auth provider when the credential reaches the API.
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-footer">
          New here? <Link to="/signup">Create your account</Link>
        </div>
      </div>
    </div>
  );
}
