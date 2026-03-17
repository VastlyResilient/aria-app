export const requireAuth = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length < 8) {
    return res.status(401).json({ error: 'Missing session ID' });
  }
  req.userId = sessionId.trim();
  next();
};
