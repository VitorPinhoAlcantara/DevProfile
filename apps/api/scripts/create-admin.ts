// Creates the admin user, or resets its password if the e-mail already exists.
// Run: pnpm --filter @devprofile/api admin:create
// Docker: docker compose run --rm -it migrate tsx scripts/create-admin.ts
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { MIN_PASSWORD_LENGTH } from '@devprofile/shared';
import { hashPassword } from '../src/auth/crypto.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

/** Reads a line without echoing it to the terminal. */
async function askHidden(question: string): Promise<string> {
  stdout.write(question);
  stdin.setRawMode?.(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  let value = '';
  return new Promise((resolve, reject) => {
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          reject(new Error('Cancelado'));
          return;
        }
        value = char === '\u007f' ? value.slice(0, -1) : value + char;
      }
    };
    stdin.on('data', onData);
  });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  const rl = createInterface({ input: stdin, output: stdout });
  const email = (
    process.env.ADMIN_EMAIL ?? (await rl.question('E-mail do admin: '))
  )
    .trim()
    .toLowerCase();
  rl.close();

  const password = process.env.ADMIN_PASSWORD ?? (await askHidden('Senha: '));
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (!process.env.ADMIN_PASSWORD) {
    const again = await askHidden('Repita a senha: ');
    if (again !== password) throw new Error('As senhas não conferem.');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
  // A password reset also logs out every open session.
  await prisma.session.deleteMany({ where: { userId: user.id } });
  console.log(`Admin pronto: ${email}`);
} finally {
  await prisma.$disconnect();
}
