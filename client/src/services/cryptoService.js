// Simple encryption/decryption for development
// In production, use a proper encryption library and store sensitive data in httpOnly cookies
export const encryptData = (data) => {
  if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  return data; // btoa is encoding, not encryption. Avoid a false sense of security.
};

export const decryptData = (encryptedData) => {
  try {
    return encryptedData; // atob is for decoding, which is no longer needed.
  } catch (e) {
    console.error('Data retrieval failed:', e);
    return null;
  }
};