import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuthHook';
import { AuthPasswordField } from './AuthPasswordField';
import './AuthPages.css';

export function ForgotPasswordPage() {
  const { requestPasswordReset, resetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'development' | 'email' | ''>('');
  const [localError, setLocalError] = useState('');

  const handleRequestCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError('');
    setMessage('');
    clearError();

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      setDevelopmentCode(response.developmentCode || '');
      setDeliveryMethod(response.deliveryMethod || (response.developmentCode ? 'development' : 'email'));
      setStep('confirm');
    } catch {
      // Error state is managed by the auth provider.
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError('');
    setMessage('');
    clearError();

    try {
      await resetPassword({ email, code, newPassword });
      navigate('/login');
    } catch {
      // Error state is managed by the auth provider.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Password Recovery</p>
        <h1>Reset password</h1>
        <p className="auth-copy">
          Request a reset code, then confirm it here with your new password. Use the
          same email you signed up with. Google-only accounts do not use password reset codes.
        </p>

        {step === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <div className="auth-field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button className="auth-primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Sending code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-field">
              <label htmlFor="confirm-email">Email</label>
              <input
                id="confirm-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reset-code">Reset code</label>
              <input
                id="reset-code"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </div>

            <AuthPasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />

            <button className="auth-primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Updating password...' : 'Update Password'}
            </button>

            <button
              className="auth-secondary-button"
              type="button"
              disabled={submitting}
              onClick={() => {
                setStep('request');
                setCode('');
                setNewPassword('');
                setLocalError('');
                setMessage('');
                setDevelopmentCode('');
                setDeliveryMethod('');
                clearError();
              }}
            >
              Start Over
            </button>
          </form>
        )}

        {message && <div className="auth-message">{message}</div>}
        {deliveryMethod === 'email' && (
          <div className="auth-message">
            JCMarket sent the reset code from the backend to the email address you entered.
          </div>
        )}
        {developmentCode && (
          <div className="auth-dev-code">
            Development reset code:
            <strong>{developmentCode}</strong>
          </div>
        )}
        {(localError || error) && <div className="auth-error">{localError || error}</div>}

        <div className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
