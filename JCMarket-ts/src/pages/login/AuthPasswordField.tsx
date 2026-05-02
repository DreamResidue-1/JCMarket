import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

type AuthPasswordFieldProps = {
  autoComplete?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export function AuthPasswordField({
  autoComplete,
  id,
  label,
  onChange,
  value
}: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrap">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => {
            setShowPassword((currentValue) => !currentValue);
          }}
        >
          {showPassword ? t('hide') : t('show')}
        </button>
      </div>
    </div>
  );
}
