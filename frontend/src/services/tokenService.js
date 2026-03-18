const TOKEN_STORAGE_KEY = "trace_auth_token";

const decodeTokenPayload = (token) => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) {
      return null;
    }

    const normalizedPayload = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const decoded = atob(paddedPayload);

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }

  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export { TOKEN_STORAGE_KEY };
