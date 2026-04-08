export const getAvatarInitials = (value?: string | null) => {
  const source = (value || '').trim();

  if (!source) {
    return 'JC';
  }

  const parts = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return source.slice(0, 2).toUpperCase();
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2);
};

const maxAvatarSizeBytes = 2 * 1024 * 1024;

export const readAvatarFile = (file: File) => new Promise<string>((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Please choose an image file.'));
    return;
  }

  if (file.size > maxAvatarSizeBytes) {
    reject(new Error('Please choose an image smaller than 2 MB.'));
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    const result = typeof event.target?.result === 'string' ? event.target.result : '';

    if (!result) {
      reject(new Error('We could not read that image.'));
      return;
    }

    resolve(result);
  };

  reader.onerror = () => {
    reject(new Error('We could not read that image.'));
  };

  reader.readAsDataURL(file);
});
