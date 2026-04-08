import { useState } from 'react';

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
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
