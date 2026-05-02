import { getAvatarInitials } from '../../lib/avatar';
import { useLanguage } from '../../i18n/LanguageContext';

type AuthProfilePreviewProps = {
  imageUrl?: string | null;
  label?: string | null;
  title: string;
};

export function AuthProfilePreview({ imageUrl, label, title }: AuthProfilePreviewProps) {
  const { t } = useLanguage();

  return (
    <div className="auth-profile-preview">
      {imageUrl ? (
        <img className="auth-profile-image" src={imageUrl} alt={label || title} />
      ) : (
        <div className="auth-profile-fallback">{getAvatarInitials(label || title)}</div>
      )}
      <div className="auth-profile-copy">
        <span>{title}</span>
        <strong>{label || t('profileImage')}</strong>
      </div>
    </div>
  );
}
