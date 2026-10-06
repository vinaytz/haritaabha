/**
 * npm run admin:set   → makes ADMIN_EMAIL / ADMIN_PASSWORD from .env.local the store admin.
 * Creates the account if it doesn't exist, otherwise resets its password and signs it out everywhere.
 * Also removes the demo admin (admin@haritaabha.local) once a real one is set.
 */
import { connect } from "./_shared";

const DEMO_ADMIN = "admin@haritaabha.local";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 8) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env.local first.");
    process.exit(1);
  }
  const { auth, db, close } = await connect();
  try {
    const users = db.collection("user");
    let user = await users.findOne({ email });
    if (!user) {
      await auth.api.signUpEmail({ body: { email, password, name: "Store admin" } });
      user = await users.findOne({ email });
      console.log(`Created ${email}.`);
    } else {
      const hash = await (await auth.$context).password.hash(password);
      const res = await db.collection("account").updateOne({ userId: user._id, providerId: "credential" }, { $set: { password: hash, updatedAt: new Date() } });
      if (!res.matchedCount) {
        await db.collection("account").insertOne({ userId: user._id, accountId: String(user._id), providerId: "credential", password: hash, createdAt: new Date(), updatedAt: new Date() });
      }
      await db.collection("session").deleteMany({ userId: user._id });
      console.log(`Password updated for ${email}.`);
    }
    await users.updateOne({ _id: user!._id }, { $set: { role: "admin" } });

    if (email !== DEMO_ADMIN) {
      const demo = await users.findOne({ email: DEMO_ADMIN });
      if (demo) {
        await Promise.all([
          db.collection("session").deleteMany({ userId: demo._id }),
          db.collection("account").deleteMany({ userId: demo._id }),
          users.deleteOne({ _id: demo._id }),
        ]);
        console.log(`Removed the demo admin ${DEMO_ADMIN}.`);
      }
    }
    console.log(`${email} is the store admin. Sign in at /admin.`);
  } finally {
    await close();
  }
}
main();
