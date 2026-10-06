/**
 * npm run seed         → demo categories + products (isDemo: true), settings, first admin
 * npm run seed:clear   → removes every isDemo record (run before go-live)
 */
import { connect } from "./_shared";
import { Category, Product, Settings } from "../src/models";
import { categories, products } from "./data/demo-catalog";

const clear = process.argv.includes("--clear");

async function main() {
  const { auth, db, close } = await connect();
  try {
    if (clear) {
      const p = await Product.deleteMany({ isDemo: true });
      const c = await Category.deleteMany({ isDemo: true });
      console.log(`Removed ${p.deletedCount} demo products and ${c.deletedCount} demo categories.`);
      console.log("Demo photos live in public/demo — delete that folder too before go-live.");
      return;
    }

    await Promise.all([Category.syncIndexes(), Product.syncIndexes()]);

    const catIds = new Map<string, unknown>();
    for (const [i, c] of categories.entries()) {
      const doc = await Category.findOneAndUpdate(
        { slug: c.slug },
        {
          $set: {
            name: c.name,
            description: c.description,
            image: { url: c.image, fileId: "" },
            sortOrder: i,
            isActive: true,
            isDemo: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      catIds.set(c.slug, doc._id);
    }

    for (const p of products) {
      const images = Array.from({ length: p.images }, (_, i) => ({
        url: `/demo/${p.slug}-${i + 1}.webp`,
        fileId: "",
        alt: i === 0 ? p.name : `${p.name}, view ${i + 1}`,
      }));
      await Product.findOneAndUpdate(
        { slug: p.slug },
        {
          $set: {
            name: p.name,
            botanicalName: p.botanicalName ?? "",
            category: catIds.get(p.category),
            shortDescription: p.short,
            description: p.description,
            images,
            price: p.price * 100,
            compareAtPrice: p.compareAt ? p.compareAt * 100 : null,
            stock: p.stock,
            sku: `HB-${p.slug.split("-").map((w) => w[0]).join("").toUpperCase()}-${String(products.indexOf(p) + 1).padStart(3, "0")}`,
            care: {
              light: p.light ?? null,
              water: p.water ?? null,
              level: p.level ?? null,
              petSafe: p.petSafe ?? null,
              airPurifying: p.airPurifying ?? false,
              notes: p.notes ?? "",
            },
            size: {
              heightCm: p.heightCm ?? null,
              potSizeIn: p.potSizeIn ?? null,
              potIncluded: p.potIncluded ?? true,
              label: p.sizeLabel ?? "",
            },
            shipping: {
              weightKg: p.weightKg,
              lengthCm: Math.max(15, (p.potSizeIn ?? 6) * 2.54 + 6),
              breadthCm: Math.max(15, (p.potSizeIn ?? 6) * 2.54 + 6),
              heightCm: Math.max(20, (p.heightCm ?? 25) + 10),
            },
            tags: p.tags ?? [],
            isFeatured: p.featured ?? false,
            isActive: true,
            salesCount: p.sales ?? 0,
            isDemo: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }

    await Settings.findOneAndUpdate({ key: "store" }, { $setOnInsert: { key: "store" } }, { upsert: true });

    // First admin
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      const users = db.collection("user");
      let user = await users.findOne({ email: email.toLowerCase() });
      if (!user) {
        await auth.api.signUpEmail({ body: { email, password, name: "Store admin" } });
        user = await users.findOne({ email: email.toLowerCase() });
      }
      await users.updateOne({ _id: user!._id }, { $set: { role: "admin" } });
      console.log(`Admin ready: ${email}`);
    }

    console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
