import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, SECRET_CODE, UserRecord } from './db';

const AUTH_SECRET = process.env.AUTH_SECRET || 'hotel-it-inventory-secure-secret-2026';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: string;
  exp: number;
}

export interface SecretTokenPayload {
  purpose: 'user_management';
  exp: number;
}

export function generateToken(user: UserRecord): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: AuthTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
  return `${header}.${payloadB64}.${signature}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: AuthTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function generateSecretToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: SecretTokenPayload = {
    purpose: 'user_management',
    exp: Date.now() + 30 * 60 * 1000, // 30 minutes
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
  return `${header}.${payloadB64}.${signature}`;
}

export function verifySecretToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return false;
    }

    const payload: SecretTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    return payload.purpose === 'user_management' && payload.exp >= Date.now();
  } catch {
    return false;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token required' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }

  req.user = payload;
  next();
}
