import type { ReactNode } from "react";

/**
 * Store policy pages. Razorpay requires Shipping, Refunds, Privacy, Terms and Contact pages
 * during account activation. Text marked [CLIENT] must be confirmed by the store owner before go-live.
 */
export type PolicyPage = { title: string; description: string; updated: string; body: (ctx: { phone: string; email: string }) => ReactNode };

const UPDATED = "28 September 2026";

export const POLICIES: Record<string, PolicyPage> = {
  about: {
    title: "About haritaabha",
    description: "A nursery that grows plants for Indian homes and delivers them across the country.",
    updated: UPDATED,
    body: () => (
      <>
        <p>
          <em>Harit</em> means green and <em>ābhā</em> means radiance. We started haritaabha because buying plants online too often meant
          guessing — will this survive in my flat, with my light, through a Delhi summer or a Mumbai monsoon?
        </p>
        <p>
          Every plant we sell is grown and hardened at our own nursery before it’s packed. We describe each one by the light it
          needs, how often to water it and whether it’s safe around pets, so you can choose with confidence.
        </p>
        <h2>How we pack</h2>
        <p>
          Soil is secured so it doesn’t spill, pots are braced inside breathable boxes, and each plant travels with a printed care
          card. Most orders leave the nursery within one to two working days.
        </p>
      </>
    ),
  },
  contact: {
    title: "Contact us",
    description: "Questions about an order, a plant or bulk gifting — here’s how to reach us.",
    updated: UPDATED,
    body: ({ phone, email }) => (
      <>
        <p>We usually reply within one working day, Monday to Saturday, 10 am to 6 pm.</p>
        <ul>
          {email && <li>Email: <a href={`mailto:${email}`}>{email}</a></li>}
          {phone && <li>Phone / WhatsApp: <a href={`tel:${phone}`}>{phone}</a></li>}
          {!email && !phone && <li>Contact details will be added here shortly.</li>}
        </ul>
        <p>For an existing order, include your order number (it starts with HB) so we can help faster.</p>
        <h2>Registered address</h2>
        <p>[CLIENT] Business name, nursery address, city, state, pincode. GSTIN if applicable.</p>
      </>
    ),
  },
  "shipping-policy": {
    title: "Shipping & delivery",
    description: "Where we deliver, how long it takes and what it costs.",
    updated: UPDATED,
    body: () => (
      <>
        <h2>Where we deliver</h2>
        <p>We ship across India through our courier partners. Enter your pincode on any product page to check delivery and an estimated date.</p>
        <h2>Dispatch and delivery times</h2>
        <p>Orders are packed and handed to the courier within 1–2 working days. Delivery usually takes 3–7 days after dispatch, depending on your location.</p>
        <h2>Charges</h2>
        <p>Delivery charges are shown at checkout before you pay. Orders above the free-delivery threshold shown on the site ship free. Cash on delivery orders may carry a small handling fee, also shown at checkout.</p>
        <h2>Tracking</h2>
        <p>Once your order ships, you’ll find the courier name and tracking number on your order page under My orders.</p>
        <h2>Failed deliveries</h2>
        <p>If the courier can’t deliver after repeated attempts, the parcel returns to our nursery. We’ll contact you to reship (shipping charged again) or refund prepaid orders minus shipping costs.</p>
      </>
    ),
  },
  returns: {
    title: "Returns & refunds",
    description: "What happens if a plant arrives damaged, and how refunds work.",
    updated: UPDATED,
    body: () => (
      <>
        <p>Plants are living things, so we can’t accept returns for a change of mind. We do stand behind every plant we send.</p>
        <h2>Damaged on arrival</h2>
        <p>
          If your plant or pot arrives damaged, send us a photo of the plant and the box within 48 hours of delivery with your
          order number. We’ll send a replacement or issue a refund.
        </p>
        <h2>Cancellations</h2>
        <p>You can cancel from your order page until the order is packed. After that, contact us and we’ll do our best.</p>
        <h2>Refund timelines</h2>
        <p>Approved refunds go back to the original payment method within 5–7 working days. Cash on delivery orders are refunded by bank transfer or UPI.</p>
        <p>[CLIENT] Confirm the claim window (48 hours), and whether minor leaf damage in transit qualifies.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    description: "What we collect, why, and how we protect it.",
    updated: UPDATED,
    body: () => (
      <>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your name, email and, if you add it, phone number.</li>
          <li>Delivery addresses you save or use at checkout.</li>
          <li>Order history and payment status. We never see or store your card, UPI or bank details — payments are handled by Razorpay.</li>
          <li>Basic analytics about how the site is used (pages viewed, device type), if analytics is enabled.</li>
        </ul>
        <h2>How we use it</h2>
        <p>To process and deliver your orders, provide support, prevent fraud and improve the store. We share delivery details with our courier partners only to deliver your order.</p>
        <h2>Your choices</h2>
        <p>You can update your details and addresses from your account at any time, or ask us to delete your account by contacting us.</p>
        <h2>Security</h2>
        <p>Data is sent over HTTPS, passwords are stored hashed, and access to order data is limited to store staff.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of service",
    description: "The terms that apply when you use this site and place an order.",
    updated: UPDATED,
    body: () => (
      <>
        <p>By using this website and placing an order, you agree to these terms.</p>
        <h2>Products</h2>
        <p>Plants are natural products. Size, shape and colour may vary slightly from the photos, and a plant may be dormant or between flowering cycles when it arrives.</p>
        <h2>Pricing and payment</h2>
        <p>Prices are in Indian rupees and include applicable taxes. We may change prices at any time, but you’ll pay the price shown when you place your order. Online payments are processed securely by Razorpay.</p>
        <h2>Orders</h2>
        <p>We may cancel an order if an item becomes unavailable or a pincode can’t be served; any payment will be refunded in full.</p>
        <h2>Liability</h2>
        <p>Care guidance is provided in good faith. We aren’t liable for plant loss caused by conditions after delivery. Our total liability for any order is limited to the amount paid for it.</p>
        <h2>Governing law</h2>
        <p>[CLIENT] These terms are governed by the laws of India, with courts in [city] having jurisdiction.</p>
      </>
    ),
  },
};
