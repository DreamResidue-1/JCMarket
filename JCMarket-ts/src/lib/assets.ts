const configuredBaseUrl = (
  import.meta.env.VITE_API_URL
  || import.meta.env.VITE_API_BASE_URL
  || ''
).trim().replace(/\/+$/, '');

const hasProtocol = (value: string) => /^[a-z]+:/i.test(value);

export const resolveBackendAssetUrl = (assetPath = '') => {
  const trimmedPath = assetPath.trim();

  if (!trimmedPath || hasProtocol(trimmedPath) || trimmedPath.startsWith('//')) {
    return trimmedPath;
  }

  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  return configuredBaseUrl ? `${configuredBaseUrl}${normalizedPath}` : normalizedPath;
};
