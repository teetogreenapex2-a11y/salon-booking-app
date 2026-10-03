// Run this on your own computer to turn a password into the scrambled
// "hash" value that goes in the database — the real password itself is
// never stored or sent anywhere.
//
// Usage:
//   node scripts/hash-password.js YourChosenPassword
//
// It prints a long string starting with $2. Copy that whole string and
// paste it into Prisma Studio, into the passwordHash field on your User
// row (the one whose email you want to sign in with).

const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.js YourChosenPassword");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("\nPaste this into the passwordHash field in Prisma Studio:\n");
  console.log(hash);
  console.log("");
});
