import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuthHook';
import { useLanguage } from '../../i18n/LanguageContext';
import { getErrorMessage } from '../../lib/errors';
import { AuthPasswordField } from './AuthPasswordField';
import './AuthPages.css';

export function ForgotPasswordPage() {
  const { requestPasswordReset, resetPassword, error, clearError } = useAuth();
  const { t } = useLanguage();
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
    } catch (requestError) {
      setLocalError(getErrorMessage(requestError, 'Password reset request failed.'));
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
    } catch (resetError) {
      setLocalError(getErrorMessage(resetError, 'Password reset failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">{t('passwordRecovery')}</p>
        <h1>{t('resetPassword')}</h1>
        <p className="auth-copy">
          {t('forgotCopy')}
        </p>

        {step === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <div className="auth-field">
              <label htmlFor="reset-email">{t('email')}</label>
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
              {submitting ? t('sendingCode') : t('sendResetCode')}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-field">
              <label htmlFor="confirm-email">{t('email')}</label>
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
              <label htmlFor="reset-code">{t('resetCode')}</label>
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
              label={t('newPassword')}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />

            <button className="auth-primary-button" type="submit" disabled={submitting}>
              {submitting ? t('updatingPassword') : t('updatePassword')}
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
              {t('startOver')}
            </button>
          </form>
        )}

        {message && <div className="auth-message">{message}</div>}
        {deliveryMethod === 'email' && (
          <div className="auth-message">
            {t('resetCodeEmailSent')}
          </div>
        )}
        {developmentCode && (
          <div className="auth-dev-code">
            {t('developmentResetCode')}
            <strong>{developmentCode}</strong>
          </div>
        )}
        {(localError || error) && <div className="auth-error">{localError || error}</div>}

        <div className="auth-footer">
          <Link to="/login">{t('backToSignIn')}</Link>
        </div>
      </div>
    </div>
  );
}
