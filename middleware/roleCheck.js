const roleCheck = (roles = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  const userRole = req.user.role;

  if (!Array.isArray(roles)) {
    roles = [roles];
  }

  if (!roles.includes(userRole)) {
    return res.status(403).json({ success: false, message: 'No autorizado para esta acción' });
  }

  next();
};

module.exports = roleCheck;
