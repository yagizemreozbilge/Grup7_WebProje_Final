const authorize = (...roles) => {
  // Flatten roles array if nested
  const rolesArray = roles.length === 1 && Array.isArray(roles[0]) ? roles[0] : roles;
  const allowed = rolesArray.map(r => (typeof r === 'string' ? r : String(r)).toUpperCase());
  
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

