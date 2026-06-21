import type { RequestHandler } from 'express';

/**
 * Middleware to restrict access to ADMIN users only.
 * Must be used AFTER `requireAuth`, which populates `req.user`.
 *
 * Usage: app.get('/api/users', requireAuth, requireAdmin, handler)
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  // requireAuth must run before this — if req.user is missing, session is invalid
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
};
