const noticeStorageKey = 'jcmarket-company-notice';

export const queueCompanyNotice = (message: string) => {
  if (!message) {
    return;
  }

  try {
    sessionStorage.setItem(noticeStorageKey, message);
  } catch {
    // Ignore storage errors in private browsing modes.
  }
};

export const consumeCompanyNotice = () => {
  try {
    const message = sessionStorage.getItem(noticeStorageKey);

    if (!message) {
      return null;
    }

    sessionStorage.removeItem(noticeStorageKey);
    return message;
  } catch {
    return null;
  }
};
