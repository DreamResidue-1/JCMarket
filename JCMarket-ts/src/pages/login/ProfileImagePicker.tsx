import { useId, useRef, useState } from 'react';

const defaultImageUrl = 'https://t3.ftcdn.net/jpg/03/46/83/96/360_F_346839683_6nAPzbhpSkIpb8pmAwufkC7c5eD7wYws.jpg';
const maxImageSizeBytes = 2 * 1024 * 1024;

type ProfileImagePickerProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
  variant?: 'inline' | 'corner';
};

export function ProfileImagePicker({
  label,
  onChange,
  value,
  variant = 'inline'
}: ProfileImagePickerProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState('');
  const imageSource = value || defaultImageUrl;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose an image file.');
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setLocalError('Please choose an image smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const nextValue = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';

      if (!nextValue) {
        setLocalError('We could not read that image.');
        return;
      }

      setLocalError('');
      onChange(nextValue);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className={`auth-image-picker auth-image-picker-${variant}`}>
      <div className="circle">
        <img className="profile-pic" src={imageSource} alt={label} />
        <div className="p-image">
          <button
            aria-label="Choose profile image"
            className="upload-button"
            type="button"
            onClick={openFilePicker}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 4h6l1.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5L9 4Zm3 11.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7Z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            className="file-upload"
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="auth-image-picker-copy">
        <strong>Profile image</strong>
        <span>Click the camera icon to upload your picture.</span>
      </div>

      {localError && <div className="auth-error">{localError}</div>}
    </div>
  );
}
