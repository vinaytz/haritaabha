/** npm run admin:create -- someone@example.com   → gives an existing account admin access */
import { connect } from "./_shared";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const demote = process.argv.includes("--remove");
  if (!email) {
    console.error("Usage: npm run admin:create -- <email> [--remove]");
    process.exit(1);
  }
  const { db, close } = await connect();
  try {
    const res = await db.collection("user").updateOne({ email }, { $set: { role: demote ? "user" : "admin" } });
    if (!res.matchedCount) console.error(`No account for ${email}. Ask them to sign up first.`);
    else console.log(`${email} is now ${demote ? "a regular user" : "an admin"}.`);
  } finally {
    await close();
  }
}
main();
