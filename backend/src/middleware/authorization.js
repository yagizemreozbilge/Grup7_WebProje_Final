const authorize = (...roles) => {
  const allowed = roles.map(r => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (!allowed.includes((req.user.role || '').toUpperCase())) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }

    next();
  };
};

module.exports = { authorize };

