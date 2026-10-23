// Creates or updates a Manor user. Usage:
//   npm run add-user -- <email> <companyId> [--admin] [--name "Full Name"]
// Prompts for the password so it never lands in shell history.
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const [, value] = args.splice(i, 2);
  return value;
};
const admin = args.includes('--admin');
if (admin) args.splice(args.indexOf('--admin'), 1);
const name = flag('--name');
const [rawEmail, companyId] = args;
if (!rawEmail || !companyId) {
  console.error('Usage: npm run add-user -- <email> <companyId> [--admin] [--name "Full Name"]');
  process.exit(1);
}
const email = rawEmail.trim().toLowerCase();

const password = process.env.MANOR_PASSWORD ?? (await new Promise((resolve) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Password (min 10 characters): ', (answer) => { rl.close(); resolve(answer); });
}));
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const passwordHash = `scrypt$${salt.toString('base64')}$${scryptSync(password, salt, 64).toString('base64')}`;

const file = process.env.MANOR_USERS_FILE || 'manor.users.json';
const { users } = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { users: [] };
const user = { email, name: name ?? email.split('@')[0], companyId, role: admin ? 'admin' : 'editor', passwordHash };
const existing = users.findIndex((u) => u.email === email);
if (existing === -1) users.push(user);
else users[existing] = user;
writeFileSync(file, JSON.stringify({ users }, null, 2) + '\n', { mode: 0o600 });
console.log(`${existing === -1 ? 'Added' : 'Updated'} ${email} (${user.role}, company "${companyId}") in ${file}`);
