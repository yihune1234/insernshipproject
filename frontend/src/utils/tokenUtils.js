export const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
};

export const getTokenRole = (token) => {
  const decoded = decodeJwt(token);
  return decoded?.role || null;
};
