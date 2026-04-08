import { getAvatarInitials } from '../../lib/avatar';

type AuthProfilePreviewProps = {
  imageUrl?: string | null;
  label?: string | null;
  title: string;
};

export function AuthProfilePreview({ imageUrl, label, title }: AuthProfilePreviewProps) {
  return (
    <div className="auth-profile-preview">
      {imageUrl ? (
        <img className="auth-profile-image" src={imageUrl} alt={label || title} />
      ) : (
        <div className="auth-profile-fallback">{getAvatarInitials(label || title)}</div>
      )}
      <div className="auth-profile-copy">
        <span>{title}</span>
        <strong>{label || 'Profile image'}</strong>
      </div>
    </div>
  );
}
