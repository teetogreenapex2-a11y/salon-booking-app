// Gives an existing account a password so it can sign in with email + password
// (used for the App Store reviewer's demo login).
//
// Usage:  node scripts/set-password.js demo@example.com YourChosenPassword
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/set-password.js email password");
  process.exit(1);
}

(async () => {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error("No account with that email. Sign up with it first, then run this again.");
    process.exit(1);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10), emailVerified: user.emailVerified ?? new Date() },
  });
  console.log("Password set for " + email);
  await prisma.$disconnect();
})();
