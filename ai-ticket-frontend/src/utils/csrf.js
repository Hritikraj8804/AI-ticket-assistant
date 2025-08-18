// Simple CSRF token utility
export const generateCSRFToken = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    return array[0].toString(36) + array[1].toString(36) + Date.now().toString(36);
  }
  // Fallback for environments without crypto
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const getCSRFToken = () => {
  let token = sessionStorage.getItem('csrf-token');
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('csrf-token', token);
  }
  return token;
};

export const addCSRFHeaders = (headers = {}) => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  };
};