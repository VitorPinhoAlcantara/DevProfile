import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { Secret, TOTP } from 'otpauth';

const DEV_SECRET = 'dev-only-secret-change-me-in-production-0000';

/** APP_SECRET protects data at rest (TOTP secrets). Required in production. */
function appKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_SECRET must be set (at least 32 characters)');
    }
    return createHash('sha256').update(DEV_SECRET).digest();
  }
  return createHash('sha256').update(secret).digest();
}

/** AES-256-GCM; output is `iv.tag.ciphertext`, all base64url. */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', appKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString('base64url'))
    .join('.');
}

export function decrypt(sealed: string): string {
  const [iv, tag, data] = sealed
    .split('.')
    .map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', appKey(), iv!);
  decipher.setAuthTag(tag!);
  return Buffer.concat([decipher.update(data!), decipher.final()]).toString(
    'utf8',
  );
}

// Argon2id with the library defaults (OWASP-recommended parameters).
export const hashPassword = (password: string) => hash(password);
export const verifyPassword = (passwordHash: string, password: string) =>
  verify(passwordHash, password);

// Verifying against a throwaway hash when the e-mail doesn't exist keeps the
// response time the same, so login doesn't reveal which accounts exist.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string) {
  dummyHash ??= hash('not-a-real-password');
  await verify(await dummyHash, password);
  return false;
}

/** Session tokens: 32 random bytes for the cookie, only the SHA-256 is stored. */
export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const TOTP_ISSUER = 'Portfólio Vitor';

export function newTotpSecret() {
  return new Secret({ size: 20 }).base32;
}

function totpFor(secretBase32: string, label: string) {
  return new TOTP({
    issuer: TOTP_ISSUER,
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export const totpUri = (secretBase32: string, label: string) =>
  totpFor(secretBase32, label).toString();

/** Accepts the current code and one step either side (clock drift). */
export const verifyTotp = (secretBase32: string, code: string) =>
  totpFor(secretBase32, 'admin').validate({ token: code, window: 1 }) !== null;
