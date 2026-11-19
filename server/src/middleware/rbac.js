const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        },
      });
    }

    next();
  };
};

const requireTrialAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  // Admin has access to all trials
  if (req.user.role === 'admin') {
    return next();
  }

  // Determine trialId from path params or body
  const trialId = req.params.id || req.params.trialId || req.body.trialId;
  if (!trialId) {
    return next();
  }

  const userAssigned = (req.user.assignedTrials || []).map(id => id.toString());
  if (!userAssigned.includes(trialId.toString())) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access or modify this clinical trial.',
      },
    });
  }

  next();
};

module.exports = { authorize, requireTrialAccess };
