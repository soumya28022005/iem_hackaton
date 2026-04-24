const { prisma } = require('../lib/prisma');
const { AppError, asyncHandler } = require('../lib/http');
const { verifyToken } = require('../lib/tokens');

const verifyAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    throw new AppError(401, 'Unauthorized: bearer token required');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    console.warn(`Auth failed: Invalid token - ${err.message}`);
    throw new AppError(401, 'Unauthorized: invalid token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.is_active) {
    throw new AppError(401, 'Unauthorized: user not found');
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) return next();

  try {
    const payload = verifyToken(token);
    req.user = await prisma.user.findUnique({ where: { id: payload.sub } });
  } catch (_err) {
    req.user = null;
  }

  next();
});

const requireWorkspaceAccess = asyncHandler(async (req, _res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id || req.query.workspace_id || req.body.workspace_id;
  if (!workspaceId) {
    throw new AppError(400, 'workspace_id is required');
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id: req.user.id,
      },
    },
  });

  if (!membership) {
    throw new AppError(403, 'Forbidden: workspace access required');
  }

  req.workspace_id = workspaceId;
  req.workspaceRole = membership.role;
  next();
});

module.exports = {
  verifyAuth,
  verifyFirebaseAuth: verifyAuth,
  optionalAuth,
  requireWorkspaceAccess,
};
