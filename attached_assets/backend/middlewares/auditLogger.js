const AuditLog = require('../models/AuditLog');

const auditLogger = async (req, res, next) => {
  // Skip GET requests and public routes
  if (req.method === 'GET' || req.path.includes('/public/')) {
    return next();
  }

  const originalSend = res.send;

  res.send = function(data) {
    res.send = originalSend;

    // Log the action
    if (req.user) {
      const auditData = {
        user: req.user._id,
        action: getActionFromRequest(req),
        resource: getResourceFromPath(req.path),
        method: req.method,
        endpoint: req.originalUrl,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: res.statusCode < 400 ? 'success' : 'failure'
      };

      // Extract resource ID from params
      if (req.params.id) {
        auditData.resourceId = req.params.id;
      }

      AuditLog.create(auditData).catch(err => {
        console.error('Audit log error:', err.message);
      });
    }

    return res.send(data);
  };

  next();
};

function getActionFromRequest(req) {
  const method = req.method;
  const path = req.path;

  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  
  return 'ACTION';
}

function getResourceFromPath(path) {
  const parts = path.split('/').filter(p => p);
  if (parts.length > 1) {
    return parts[1].toUpperCase();
  }
  return 'UNKNOWN';
}

module.exports = auditLogger;