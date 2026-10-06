import "server-only";

/**
 * Server-side environment. Integrations are optional: when their keys are
 * missing the app runs them in mock mode (dev / staging demo only).
 */
function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

const isProd = process.env.NODE_ENV === "production";
const allowMock = !isProd || read("ALLOW_MOCK_INTEGRATIONS") === "true";

export const env = {
  isProd,
  siteUrl: read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000",
  mongoUri: read("MONGODB_URI"),
  auth: {
    secret: read("BETTER_AUTH_SECRET"),
    url: read("BETTER_AUTH_URL") || read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000",
    googleClientId: read("GOOGLE_CLIENT_ID"),
    googleClientSecret: read("GOOGLE_CLIENT_SECRET"),
  },
  razorpay: {
    keyId: read("RAZORPAY_KEY_ID"),
    keySecret: read("RAZORPAY_KEY_SECRET"),
    webhookSecret: read("RAZORPAY_WEBHOOK_SECRET"),
  },
  shiprocket: {
    email: read("SHIPROCKET_EMAIL"),
    password: read("SHIPROCKET_PASSWORD"),
    pickupLocation: read("SHIPROCKET_PICKUP_LOCATION"),
    webhookToken: read("SHIPROCKET_WEBHOOK_TOKEN"),
  },
  imagekit: {
    publicKey: read("IMAGEKIT_PUBLIC_KEY"),
    privateKey: read("IMAGEKIT_PRIVATE_KEY"),
    urlEndpoint: read("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"),
  },
  allowMock,
};

export const integrations = {
  google: Boolean(env.auth.googleClientId && env.auth.googleClientSecret),
  razorpay: Boolean(env.razorpay.keyId && env.razorpay.keySecret),
  shiprocket: Boolean(env.shiprocket.email && env.shiprocket.password && env.shiprocket.pickupLocation),
  imagekit: Boolean(env.imagekit.publicKey && env.imagekit.privateKey && env.imagekit.urlEndpoint),
};

const INTEGRATION_VARS = {
  "Google sign-in": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  Razorpay: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
  Shiprocket: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_PICKUP_LOCATION"],
  ImageKit: ["IMAGEKIT_PUBLIC_KEY", "IMAGEKIT_PRIVATE_KEY", "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"],
} as const;

/**
 * Integrations with some keys set but others empty — almost always a typo or a value the
 * .env parser dropped (an unquoted value starting with `#` reads as empty). Shown loudly in admin.
 */
export const misconfigured = Object.entries(INTEGRATION_VARS)
  .map(([name, vars]) => ({ name, missing: vars.filter((v) => !read(v)) }))
  .filter((i) => i.missing.length > 0 && i.missing.length < INTEGRATION_VARS[i.name as keyof typeof INTEGRATION_VARS].length);

/** Demo shipping only when Shiprocket is fully unset (never when half-configured) and mocks are allowed. */
export const shippingMocked = !integrations.shiprocket && allowMock && !misconfigured.some((i) => i.name === "Shiprocket");

/** Online payment works when Razorpay is configured, or in mock mode where allowed. */
export const canPayOnline = integrations.razorpay || allowMock;
export const paymentsMocked = !integrations.razorpay && allowMock;

if (isProd && !env.auth.secret) {
  throw new Error("BETTER_AUTH_SECRET is required in production");
}
