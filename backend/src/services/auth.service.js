const bcrypt = require('bcryptjs');
const admin = require('../config/firebase');
const { prisma } = require('../lib/prisma');
const { AppError } = require('../lib/http');
const { tokenResponse } = require('../lib/tokens');
const { ensureDefaultWorkspace } = require('./workspace.service');

const SALT_ROUNDS = 10;

function hasAdminCredentials() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

async function verifyFirebaseIdTokenViaRest(idToken) {
  if (!process.env.FIREBASE_WEB_API_KEY) {
    throw new Error('No Firebase credentials configured. Set FIREBASE_WEB_API_KEY or service account env vars.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  const body = await response.json().catch(() => null);

  if (!response.ok || !Array.isArray(body?.users) || body.users.length === 0) {
    throw new Error(body?.error?.message || response.statusText || 'Firebase REST token lookup failed');
  }

  const user = body.users[0];
  return {
    uid: user.localId,
    email: user.email,
    name: user.displayName,
    picture: user.photoUrl,
    email_verified: user.emailVerified,
  };
}

async function verifyFirebaseIdToken(idToken) {
  if (hasAdminCredentials()) {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (adminError) {
      console.warn('Firebase Admin SDK verify failed, falling back to REST:', adminError.message);
    }
  }

  return verifyFirebaseIdTokenViaRest(idToken);
}

function publicUser(user) {
  if (!user) return null;
  const { hashed_password, github_access_token, google_access_token, ...safe } = user;
  return safe;
}

async function issueSession(user) {
  await ensureDefaultWorkspace(user);
  return {
    user: publicUser(user),
    tokens: tokenResponse(user),
  };
}

async function register({ email, name, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email is already registered');
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      provider: 'email',
      hashed_password: await bcrypt.hash(password, SALT_ROUNDS),
    },
  });

  return issueSession(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.hashed_password) {
    throw new AppError(401, 'Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.hashed_password);
  if (!ok) {
    throw new AppError(401, 'Invalid email or password');
  }

  return issueSession(user);
}

async function syncFirebase(idToken) {
  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
    console.log(`[Firebase Debug] Token verified for email: ${decoded.email}, uid: ${decoded.uid}`);
  } catch (err) {
    console.error('Firebase token verification failed:', err.message);
    throw new AppError(401, `Invalid Firebase ID token: ${err.message}`);
  }

  const email = decoded.email;
  if (!email) {
    throw new AppError(400, 'Firebase token does not include an email');
  }

  let user;
  try {
    user = await prisma.user.upsert({
      where: { email },
      update: {
        name: decoded.name || undefined,
        avatar_url: decoded.picture || undefined,
        google_id: decoded.uid,
        provider: 'firebase',
      },
      create: {
        email,
        name: decoded.name || '',
        avatar_url: decoded.picture || '',
        google_id: decoded.uid,
        provider: 'firebase',
      },
    });
  } catch (dbErr) {
    console.error(`[Firebase Debug] User upsert failed for ${email}:`, dbErr.message);
    throw new AppError(500, `Database error during sync: ${dbErr.message}`);
  }

  return issueSession(user);
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'NexusOps-MVP',
    },
  });

  if (!response.ok) return null;
  return response.json();
}

async function syncGithub(accessToken) {
  const profile = await fetchJson('https://api.github.com/user', accessToken);
  const emails = await fetchJson('https://api.github.com/user/emails', accessToken);
  const primaryEmail = Array.isArray(emails)
    ? emails.find((item) => item.primary)?.email || emails[0]?.email
    : null;
  const email = profile?.email || primaryEmail || `github-${profile?.id || Date.now()}@users.nexusops.local`;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: profile?.name || profile?.login || undefined,
      avatar_url: profile?.avatar_url || undefined,
      github_id: profile?.id ? String(profile.id) : undefined,
      github_username: profile?.login || undefined,
      github_access_token: accessToken,
      provider: 'github',
    },
    create: {
      email,
      name: profile?.name || profile?.login || 'GitHub User',
      avatar_url: profile?.avatar_url || '',
      github_id: profile?.id ? String(profile.id) : undefined,
      github_username: profile?.login || undefined,
      github_access_token: accessToken,
      provider: 'github',
    },
  });

  return issueSession(user);
}

async function syncGoogle(accessToken) {
  const profile = await fetchJson('https://www.googleapis.com/oauth2/v3/userinfo', accessToken);
  const email = profile?.email || `google-${profile?.sub || Date.now()}@users.nexusops.local`;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: profile?.name || undefined,
      avatar_url: profile?.picture || undefined,
      google_id: profile?.sub || undefined,
      google_access_token: accessToken,
      provider: 'google',
    },
    create: {
      email,
      name: profile?.name || 'Google User',
      avatar_url: profile?.picture || '',
      google_id: profile?.sub || undefined,
      google_access_token: accessToken,
      provider: 'google',
    },
  });

  return issueSession(user);
}

module.exports = {
  publicUser,
  register,
  login,
  syncFirebase,
  syncGithub,
  syncGoogle,
  verifyFirebaseIdToken,
};
