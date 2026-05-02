import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuthHook';
import { useLanguage } from '../../i18n/LanguageContext';
import { AuthPasswordField } from './AuthPasswordField';
import { ProfileImagePicker } from './ProfileImagePicker';
import './AuthPages.css';

export function RegisterPage() {
  const { register, isAuthenticated, error, clearError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [picture, setPicture] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    clearError();

    if (password !== confirmPassword) {
      setLocalError(t('passwordsDoNotMatch'));
      return;
    }

    setSubmitting(true);

    try {
      await register({ name, email, password, picture });
      navigate('/');
    } catch {
      // Error state is managed by the auth provider.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-with-corner-image">
        <ProfileImagePicker
          label={name || email || t('newMember')}
          value={picture}
          onChange={setPicture}
          variant="corner"
        />
        <p className="auth-eyebrow">{t('joinJCMarket')}</p>
        <h1>{t('createAccount')}</h1>
        <p className="auth-copy">
          {t('registerCopy')}
        </p>

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-field">
            <label htmlFor="register-name">{t('name')}</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">{t('email')}</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <AuthPasswordField
            id="register-password"
            label={t('password')}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          <AuthPasswordField
            id="register-password-confirm"
            label={t('confirmPassword')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          <button className="auth-primary-button" type="submit" disabled={submitting}>
            {submitting ? t('creatingAccount') : t('createAccount')}
          </button>
        </form>

        {(localError || error) && <div className="auth-error">{localError || error}</div>}

        <div className="auth-footer">
          {t('alreadyHaveAccount')} <Link to="/login">{t('signIn')}</Link>
        </div>
      </div>
    </div>
  );
}
