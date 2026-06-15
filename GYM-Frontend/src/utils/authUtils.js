export const decodeTokenPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  if (payload.role === "member") return "member";
  if (payload.role === "admin") return "admin";
  if (payload.username) return "admin";
  return null;
};

export const getUserIdFromToken = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload?.id) return null;
  return String(payload.id);
};

export const normalizeUser = (userData, token) => {
  if (!userData) return null;

  const tokenId = token ? getUserIdFromToken(token) : null;
  const rawId = tokenId || userData.id || userData._id;
  const id = rawId ? String(rawId) : undefined;

  return {
    ...userData,
    id,
  };
};
