/**
 * Demo catalogue for staging. Every record is created with isDemo: true and is
 * removed by `npm run seed:clear`. Photos: Wikimedia Commons, see public/demo/credits.json.
 * Prices are in rupees here and converted to paise by the seed script.
 */
import type { CareLevel, LightLevel, WaterLevel } from "../../src/lib/plant-care";

export type DemoCategory = { slug: string; name: string; description: string; image: string };
export type DemoProduct = {
  slug: string;
  name: string;
  botanicalName?: string;
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  images: number; // count of /demo/<slug>-n.webp
  short: string;
  description: string;
  light?: LightLevel;
  water?: WaterLevel;
  level?: CareLevel;
  petSafe?: boolean;
  airPurifying?: boolean;
  notes?: string;
  heightCm?: number;
  potSizeIn?: number;
  potIncluded?: boolean;
  sizeLabel?: string;
  weightKg: number;
  tags?: string[];
  featured?: boolean;
  sales?: number;
};

export const categories: DemoCategory[] = [
  { slug: "indoor-plants", name: "Indoor plants", description: "Foliage plants that settle into flats, offices and bedrooms.", image: "/demo/monstera-deliciosa-1.webp" },
  { slug: "flowering-plants", name: "Flowering plants", description: "Colour for balconies and sunny windows, from mogra to bougainvillea.", image: "/demo/hibiscus-red-1.webp" },
  { slug: "succulents-cacti", name: "Succulents & cacti", description: "Sculptural, slow-growing and happy to be forgotten for a week or two.", image: "/demo/echeveria-elegans-1.webp" },
  { slug: "herbs-kitchen-garden", name: "Herbs & kitchen garden", description: "Tulsi, curry leaf, mint and more — grown to be picked.", image: "/demo/curry-leaf-1.webp" },
  { slug: "hanging-trailing", name: "Hanging & trailing", description: "Plants that spill over shelves, hang from hooks and climb.", image: "/demo/string-of-hearts-1.webp" },
  { slug: "bonsai", name: "Bonsai", description: "Trained trees in shallow pots, shaped by our nursery team.", image: "/demo/ficus-ginseng-bonsai-1.webp" },
  { slug: "planters", name: "Planters & pots", description: "Terracotta, glazed ceramic and hand-painted pots.", image: "/demo/warli-art-planter-1.webp" },
];

const W = { s: 0.8, m: 1.5, l: 3, xl: 6 };

export const products: DemoProduct[] = [
  // ─── Indoor ─────────────────────────────────────────
  {
    slug: "monstera-deliciosa", name: "Monstera deliciosa", botanicalName: "Monstera deliciosa", category: "indoor-plants",
    price: 1299, compareAt: 1599, stock: 14, images: 2, featured: true, sales: 210,
    short: "The split-leaf statement plant. Grows big, fast and forgiving in bright rooms.",
    description: "Monstera is the plant most people picture when they think of a green living room. Young leaves arrive solid and heart-shaped; as the plant matures they open into the famous splits and holes.\n\nIt grows quickly in bright, indirect light and tolerates a bit less, though growth slows and the leaves stay smaller. Give it a moss pole or a wall to lean on once it passes a metre.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false, airPurifying: true,
    notes: "Wipe leaves monthly so they can breathe. Aerial roots are normal; tuck them into the pot or a moss pole.",
    heightCm: 60, potSizeIn: 8, sizeLabel: "Medium", weightKg: W.l, tags: ["statement", "air-purifying", "bestseller"],
  },
  {
    slug: "snake-plant-laurentii", name: "Snake plant Laurentii", botanicalName: "Dracaena trifasciata 'Laurentii'", category: "indoor-plants",
    price: 549, compareAt: 699, stock: 40, images: 2, featured: true, sales: 480,
    short: "Upright, yellow-edged leaves that shrug off low light and missed waterings.",
    description: "If you have killed plants before, start here. The snake plant stores water in its thick leaves, handles dim corners and grows slowly enough that it rarely needs repotting.\n\nIts vertical shape suits narrow spaces — beside a TV unit, a bedroom door or a work desk.",
    light: "low", water: "low", level: "easy", petSafe: false, airPurifying: true,
    notes: "The only way to hurt it is overwatering. In winter, water once a month.",
    heightCm: 45, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["beginner", "air-purifying", "low-light", "bestseller"],
  },
  {
    slug: "snake-plant-moonshine", name: "Snake plant Moonshine", botanicalName: "Dracaena trifasciata 'Moonshine'", category: "indoor-plants",
    price: 699, stock: 18, images: 2, sales: 95,
    short: "A silvery-green snake plant with broad, soft-toned leaves.",
    description: "Moonshine has the same toughness as the classic snake plant but a paler, silver-mint colour that looks calm against white walls. Leaves are wider and grow in a looser rosette.",
    light: "low", water: "low", level: "easy", petSafe: false, airPurifying: true,
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["beginner", "low-light"],
  },
  {
    slug: "zz-plant", name: "ZZ plant", botanicalName: "Zamioculcas zamiifolia", category: "indoor-plants",
    price: 799, compareAt: 899, stock: 26, images: 3, featured: true, sales: 330,
    short: "Glossy, waxy leaves that look polished even under office tube lights.",
    description: "The ZZ grows from underground rhizomes that hold water for weeks, so it's one of the few plants that genuinely manages in rooms without a window view. The leaves have a natural shine that makes it look cared-for with almost no effort.",
    light: "low", water: "low", level: "easy", petSafe: false, airPurifying: true,
    notes: "Yellowing lower leaves usually mean too much water. Let the soil dry fully.",
    heightCm: 45, potSizeIn: 7, sizeLabel: "Medium", weightKg: W.m, tags: ["beginner", "low-light", "office", "bestseller"],
  },
  {
    slug: "peace-lily", name: "Peace lily", botanicalName: "Spathiphyllum wallisii", category: "indoor-plants",
    price: 499, stock: 32, images: 2, sales: 260,
    short: "Dark leaves and white blooms. Droops dramatically when thirsty, recovers in hours.",
    description: "Peace lilies flower indoors, which few houseplants do. The white 'flowers' are actually a leaf-like spathe around the bloom spike and last for weeks.\n\nIt tells you when it needs water: the whole plant slumps, then stands back up within a few hours of a drink.",
    light: "low", water: "frequent", level: "easy", petSafe: false, airPurifying: true,
    heightCm: 40, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["flowering-indoor", "air-purifying", "low-light"],
  },
  {
    slug: "rubber-plant-burgundy", name: "Rubber plant Burgundy", botanicalName: "Ficus elastica 'Burgundy'", category: "indoor-plants",
    price: 899, compareAt: 1099, stock: 12, images: 2, sales: 140,
    short: "Deep wine-coloured leaves on an upright stem that grows into a small tree.",
    description: "The rubber plant grows tall and tree-like, with large, leathery leaves in a near-black burgundy. New leaves unfurl from a red sheath, which is a small event every few weeks in summer.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false, airPurifying: true,
    heightCm: 70, potSizeIn: 8, sizeLabel: "Large", weightKg: W.l, tags: ["statement", "air-purifying"],
  },
  {
    slug: "rubber-plant-tineke", name: "Rubber plant Tineke", botanicalName: "Ficus elastica 'Tineke'", category: "indoor-plants",
    price: 999, stock: 0, images: 2, sales: 70,
    short: "Cream, green and blush-pink variegated leaves. Needs brighter light than the Burgundy.",
    description: "Tineke is the variegated form of the rubber plant. Each leaf is marbled cream and green, with pink tones on new growth. It needs more light than solid-green rubber plants to keep that colour.",
    light: "bright", water: "moderate", level: "moderate", petSafe: false,
    heightCm: 50, potSizeIn: 7, sizeLabel: "Medium", weightKg: W.l, tags: ["variegated"],
  },
  {
    slug: "fiddle-leaf-fig", name: "Fiddle leaf fig", botanicalName: "Ficus lyrata", category: "indoor-plants",
    price: 1499, compareAt: 1799, stock: 6, images: 1, sales: 60,
    short: "Big, violin-shaped leaves on a tall stem. Beautiful and a little particular.",
    description: "The fiddle leaf fig is a designer favourite for good reason: nothing else fills a bright corner quite like it. It likes routine — the same spot, steady light, even watering — and may drop a leaf or two after moving house.",
    light: "bright", water: "moderate", level: "moderate", petSafe: false,
    notes: "Rotate a quarter-turn every fortnight so it grows straight. Avoid moving it once it settles.",
    heightCm: 90, potSizeIn: 10, sizeLabel: "Large", weightKg: W.xl, tags: ["statement"],
  },
  {
    slug: "aglaonema-lipstick", name: "Aglaonema Lipstick", botanicalName: "Aglaonema 'Lipstick'", category: "indoor-plants",
    price: 649, stock: 22, images: 2, sales: 150,
    short: "Green leaves edged in pink-red. Colourful foliage that handles medium light.",
    description: "Chinese evergreens are some of the most tolerant indoor plants, and the coloured varieties bring warmth without needing flowers. Lipstick has broad green leaves with a rosy edge and pink veins.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false, airPurifying: true,
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["colourful-foliage", "air-purifying"],
  },
  {
    slug: "satin-pothos", name: "Satin pothos", botanicalName: "Scindapsus pictus 'Argyraeus'", category: "indoor-plants",
    price: 399, stock: 30, images: 3, sales: 120,
    short: "Matte, heart-shaped leaves splashed with silver. Trails or climbs.",
    description: "Satin pothos has velvety leaves with silver spots that catch the light. It can trail from a shelf or climb a small pole, and it curls its leaves slightly to tell you it wants water.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false,
    heightCm: 20, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["desk", "trailing"],
  },
  {
    slug: "syngonium-white-butterfly", name: "Syngonium White Butterfly", botanicalName: "Syngonium podophyllum", category: "indoor-plants",
    price: 299, stock: 45, images: 1, sales: 190,
    short: "Arrow-shaped leaves washed in pale green-white. Fast, bushy and cheerful.",
    description: "Syngonium is a quick grower that fills a pot within a season. White Butterfly has soft, pale leaves that brighten a darker shelf or desk.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false,
    heightCm: 25, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["desk", "beginner", "gift"],
  },
  {
    slug: "areca-palm", name: "Areca palm", botanicalName: "Dypsis lutescens", category: "indoor-plants",
    price: 849, compareAt: 999, stock: 16, images: 2, featured: true, sales: 220,
    short: "Feathery, arching fronds that soften a room. One of the best indoor air purifiers.",
    description: "Areca palms grow in clumps of cane-like stems with soft, arching fronds. They bring a relaxed, resort feel to living rooms and are regularly listed among the best plants for indoor air.",
    light: "indirect", water: "moderate", level: "easy", petSafe: true, airPurifying: true,
    notes: "Brown tips usually mean dry air or salts in tap water. Use filtered or stored water if you can.",
    heightCm: 80, potSizeIn: 10, sizeLabel: "Large", weightKg: W.xl, tags: ["pet-safe", "air-purifying", "statement"],
  },
  {
    slug: "calathea-orbifolia", name: "Calathea orbifolia", botanicalName: "Goeppertia orbifolia", category: "indoor-plants",
    price: 899, stock: 8, images: 1, sales: 45,
    short: "Huge, round leaves striped in silver-green. Needs humidity and steady care.",
    description: "Orbifolia has some of the most beautiful leaves of any houseplant: wide, round and painted with silvery bands. It rewards attention — humidity, filtered water and no cold drafts.",
    light: "indirect", water: "frequent", level: "expert", petSafe: true,
    notes: "Group with other plants or use a pebble tray to raise humidity. Crispy edges mean the air is too dry.",
    heightCm: 40, potSizeIn: 7, sizeLabel: "Medium", weightKg: W.m, tags: ["pet-safe", "patterned"],
  },
  {
    slug: "calathea-freddie", name: "Calathea Freddie", botanicalName: "Goeppertia concinna 'Freddie'", category: "indoor-plants",
    price: 599, stock: 14, images: 2, sales: 60,
    short: "Pale green leaves with dark feathered stripes. An easier calathea.",
    description: "Freddie is one of the more forgiving calatheas. Its leaves fold up in the evening and open in the morning — the reason calatheas are called prayer plants.",
    light: "indirect", water: "frequent", level: "moderate", petSafe: true,
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["pet-safe", "patterned"],
  },
  {
    slug: "prayer-plant", name: "Prayer plant", botanicalName: "Maranta leuconeura", category: "indoor-plants",
    price: 449, stock: 20, images: 2, sales: 80,
    short: "Low, spreading leaves with dark blotches. Folds its leaves at night.",
    description: "Maranta grows low and wide, making it a good tabletop or shelf plant. Its leaves lie flat by day and fold upright at night.",
    light: "indirect", water: "frequent", level: "moderate", petSafe: true,
    heightCm: 20, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["pet-safe", "patterned", "desk"],
  },
  {
    slug: "croton-petra", name: "Croton Petra", botanicalName: "Codiaeum variegatum 'Petra'", category: "indoor-plants",
    price: 399, stock: 24, images: 2, sales: 110,
    short: "Leathery leaves in red, orange, yellow and green. Loves a sunny window.",
    description: "Crotons are the most colourful foliage plants you can grow. The more sun they get, the stronger the reds and oranges. Popular across Indian homes and gardens.",
    light: "bright", water: "moderate", level: "moderate", petSafe: false,
    heightCm: 40, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["colourful-foliage"],
  },

  // ─── Flowering ──────────────────────────────────────
  {
    slug: "hibiscus-red", name: "Hibiscus (gudhal), red", botanicalName: "Hibiscus rosa-sinensis", category: "flowering-plants",
    price: 349, compareAt: 449, stock: 35, images: 1, featured: true, sales: 300,
    short: "Big red blooms almost every day through the warm months.",
    description: "Hibiscus is a classic of Indian gardens and temple offerings. Each flower lasts a day, but a healthy plant opens new ones almost daily from spring to autumn.",
    light: "sun", water: "frequent", level: "easy", petSafe: true,
    notes: "Feed every two weeks in summer for continuous flowering. Pinch tips to keep it bushy.",
    heightCm: 45, potSizeIn: 8, sizeLabel: "Medium", weightKg: W.l, tags: ["balcony", "pooja", "pet-safe"],
  },
  {
    slug: "mogra-jasmine", name: "Mogra (Arabian jasmine)", botanicalName: "Jasminum sambac", category: "flowering-plants",
    price: 299, stock: 50, images: 3, featured: true, sales: 420,
    short: "Small white flowers with the scent of Indian summer evenings.",
    description: "Mogra flowers from March to October, filling a balcony with fragrance each evening. The blooms are used in gajras and pooja.",
    light: "sun", water: "frequent", level: "easy", petSafe: true,
    notes: "Prune after each flush of flowers to encourage new flowering shoots.",
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["fragrant", "balcony", "pooja", "pet-safe", "bestseller"],
  },
  {
    slug: "bougainvillea-magenta", name: "Bougainvillea, magenta", botanicalName: "Bougainvillea glabra", category: "flowering-plants",
    price: 449, stock: 20, images: 2, sales: 160,
    short: "Masses of papery magenta bracts. Thrives in heat and full sun.",
    description: "Bougainvillea puts on its best show when it's hot, sunny and a little dry. Grow it in a pot on a terrace, train it over a railing, or shape it as a small tree.",
    light: "sun", water: "low", level: "easy", petSafe: true,
    heightCm: 60, potSizeIn: 10, sizeLabel: "Large", weightKg: W.xl, tags: ["balcony", "terrace"],
  },
  {
    slug: "bougainvillea-red", name: "Bougainvillea, red", botanicalName: "Bougainvillea × buttiana", category: "flowering-plants",
    price: 449, stock: 0, images: 2, sales: 90,
    short: "Deep red bracts for a sunny terrace. Back in stock soon.",
    description: "A red-flowering bougainvillea with the same easy nature as the magenta: full sun, well-drained soil, and less water than you'd think.",
    light: "sun", water: "low", level: "easy", petSafe: true,
    heightCm: 60, potSizeIn: 10, sizeLabel: "Large", weightKg: W.xl, tags: ["balcony", "terrace"],
  },
  {
    slug: "adenium-desert-rose", name: "Adenium (desert rose)", botanicalName: "Adenium obesum", category: "flowering-plants",
    price: 549, compareAt: 649, stock: 15, images: 2, sales: 130,
    short: "A swollen, sculptural trunk topped with pink flowers.",
    description: "Adenium stores water in its thick, bottle-shaped trunk, so it handles heat and dry spells well. It flowers best in full sun and is often grown as a living sculpture.",
    light: "sun", water: "low", level: "moderate", petSafe: false,
    heightCm: 30, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["balcony", "sculptural"],
  },
  {
    slug: "rose-red", name: "Rose (desi gulab), red", botanicalName: "Rosa × hybrida", category: "flowering-plants",
    price: 399, stock: 28, images: 2, sales: 210,
    short: "Fragrant red roses from a grafted, disease-resistant desi variety.",
    description: "A hardy, grafted rose selected for Indian summers. It flowers in flushes through the year, with a proper old-rose scent.",
    light: "sun", water: "moderate", level: "moderate", petSafe: true,
    notes: "Needs at least 5–6 hours of direct sun. Deadhead spent flowers to keep new buds coming.",
    heightCm: 40, potSizeIn: 8, sizeLabel: "Medium", weightKg: W.l, tags: ["fragrant", "balcony", "gift"],
  },
  {
    slug: "marigold-orange", name: "Marigold (genda), orange", botanicalName: "Tagetes erecta", category: "flowering-plants",
    price: 149, stock: 60, images: 2, sales: 180,
    short: "Big pom-pom flowers for festivals, pots and garden borders.",
    description: "African marigold is the genda of garlands and rangoli. It flowers for months in sun, and keeps some garden pests away from nearby vegetables.",
    light: "sun", water: "moderate", level: "easy", petSafe: true,
    heightCm: 30, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["festive", "balcony", "pooja"],
  },
  {
    slug: "marigold-french", name: "French marigold", botanicalName: "Tagetes patula", category: "flowering-plants",
    price: 129, stock: 55, images: 2, sales: 70,
    short: "Compact plants with red-and-gold flowers. Ideal for window boxes.",
    description: "Smaller and bushier than African marigold, with flowers in rich red and gold. Plant a few along a balcony railing for colour through winter.",
    light: "sun", water: "moderate", level: "easy", petSafe: true,
    heightCm: 20, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["festive", "balcony"],
  },
  {
    slug: "anthurium-red", name: "Anthurium, red", botanicalName: "Anthurium andraeanum", category: "flowering-plants",
    price: 749, compareAt: 899, stock: 12, images: 2, featured: true, sales: 140,
    short: "Glossy red 'flowers' that last for weeks indoors. A lovely gift.",
    description: "Anthurium is one of the few plants that flowers reliably indoors. The waxy red spathes last six to eight weeks each, and a happy plant produces them year-round.",
    light: "indirect", water: "moderate", level: "moderate", petSafe: false,
    heightCm: 40, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["gift", "flowering-indoor"],
  },
  {
    slug: "ixora-pink", name: "Ixora, pink", botanicalName: "Ixora coccinea", category: "flowering-plants",
    price: 249, stock: 30, images: 2, sales: 100,
    short: "Dense clusters of small pink flowers on a compact shrub.",
    description: "Ixora (rugmini) is a shrub from South India that flowers in round clusters for much of the year. It prefers slightly acidic soil and regular feeding.",
    light: "sun", water: "moderate", level: "easy", petSafe: true,
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["balcony", "pooja"],
  },
  {
    slug: "ixora-orange", name: "Ixora, orange", botanicalName: "Ixora coccinea", category: "flowering-plants",
    price: 249, stock: 25, images: 2, sales: 85,
    short: "Bright orange flower clusters, the most traditional ixora colour.",
    description: "The classic orange ixora seen in temple gardens across South India. Flowers attract butterflies and are used in pooja.",
    light: "sun", water: "moderate", level: "easy", petSafe: true,
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["balcony", "pooja"],
  },
  {
    slug: "periwinkle-sadabahar", name: "Periwinkle (sadabahar)", botanicalName: "Catharanthus roseus", category: "flowering-plants",
    price: 99, stock: 80, images: 3, sales: 240,
    short: "Pink and white flowers every single day. Asks for almost nothing.",
    description: "Sadabahar means 'always in bloom', and it lives up to the name. It handles heat, a little neglect and poor soil, and still flowers daily.",
    light: "sun", water: "low", level: "easy", petSafe: false,
    heightCm: 20, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["beginner", "balcony"],
  },

  // ─── Succulents & cacti ─────────────────────────────
  {
    slug: "jade-plant", name: "Jade plant", botanicalName: "Crassula ovata", category: "succulents-cacti",
    price: 349, compareAt: 399, stock: 38, images: 2, featured: true, sales: 350,
    short: "Thick, coin-like leaves on woody stems. Considered lucky in many homes.",
    description: "The jade plant grows slowly into a small, tree-like shape with glossy, rounded leaves. It's a popular housewarming gift and is said to bring prosperity.",
    light: "bright", water: "low", level: "easy", petSafe: false,
    heightCm: 25, potSizeIn: 5, sizeLabel: "Small", weightKg: W.m, tags: ["gift", "lucky", "desk", "bestseller"],
  },
  {
    slug: "aloe-vera", name: "Aloe vera", botanicalName: "Aloe barbadensis miller", category: "succulents-cacti",
    price: 199, stock: 60, images: 2, sales: 390,
    short: "Useful and nearly unkillable. Snap a leaf for fresh gel.",
    description: "Aloe vera needs sun and very little water. Mature leaves can be cut for fresh gel for skin and hair; the plant keeps producing new ones from the centre.",
    light: "bright", water: "low", level: "easy", petSafe: false,
    heightCm: 25, potSizeIn: 5, sizeLabel: "Small", weightKg: W.m, tags: ["beginner", "useful", "balcony"],
  },
  {
    slug: "echeveria-elegans", name: "Echeveria elegans", botanicalName: "Echeveria elegans", category: "succulents-cacti",
    price: 199, stock: 42, images: 3, sales: 170,
    short: "A pale blue-green rosette, like a sculpted flower.",
    description: "Echeveria forms tight, symmetrical rosettes that look almost carved. It needs bright light to stay compact; in shade it stretches.",
    light: "bright", water: "low", level: "easy", petSafe: true,
    heightCm: 8, potSizeIn: 3, sizeLabel: "Small", weightKg: W.s, tags: ["desk", "pet-safe", "gift"],
  },
  {
    slug: "haworthia-zebra", name: "Haworthia zebra", botanicalName: "Haworthiopsis attenuata", category: "succulents-cacti",
    price: 179, stock: 36, images: 2, sales: 150,
    short: "Pointed leaves striped with white bands. Happy on a desk.",
    description: "Haworthia is the rare succulent that doesn't need direct sun, which makes it one of the best choices for desks and windowsills without strong light.",
    light: "indirect", water: "low", level: "easy", petSafe: true,
    heightCm: 10, potSizeIn: 3, sizeLabel: "Small", weightKg: W.s, tags: ["desk", "pet-safe", "beginner"],
  },
  {
    slug: "golden-barrel-cactus", name: "Golden barrel cactus", botanicalName: "Echinocactus grusonii", category: "succulents-cacti",
    price: 449, stock: 10, images: 3, sales: 65,
    short: "A perfect sphere of golden spines. Slow-growing and striking.",
    description: "The golden barrel grows into a near-perfect ball covered in yellow spines. It needs full sun and very little water.",
    light: "sun", water: "low", level: "easy", petSafe: false,
    heightCm: 12, potSizeIn: 5, sizeLabel: "Small", weightKg: W.m, tags: ["sculptural", "balcony"],
  },
  {
    slug: "bunny-ear-cactus", name: "Bunny ear cactus", botanicalName: "Opuntia microdasys", category: "succulents-cacti",
    price: 249, stock: 22, images: 2, sales: 90,
    short: "Soft-looking paired pads dotted with fuzzy tufts. Look, don't touch.",
    description: "Pads grow in pairs that look like rabbit ears. The fuzzy dots are tiny barbed bristles, so handle with gloves.",
    light: "sun", water: "low", level: "easy", petSafe: false,
    heightCm: 15, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["desk"],
  },
  {
    slug: "cactus-trio-bowl", name: "Cactus trio bowl", category: "succulents-cacti",
    price: 699, compareAt: 849, stock: 9, images: 1, sales: 55,
    short: "Three columnar cacti planted together in a ceramic bowl.",
    description: "A ready-made arrangement of three cacti in a glazed bowl with gravel top dressing. Good for a sunny windowsill or as a gift that doesn't need much looking after.",
    light: "sun", water: "low", level: "easy", petSafe: false,
    heightCm: 20, potSizeIn: 7, sizeLabel: "Medium", potIncluded: true, weightKg: W.m, tags: ["gift", "arrangement"],
  },
  {
    slug: "succulent-bowl", name: "Succulent bowl", category: "succulents-cacti",
    price: 799, stock: 7, images: 2, featured: true, sales: 75,
    short: "A mixed bowl of rosette succulents, planted and ready to gift.",
    description: "Five to six small succulents arranged in a round bowl. Each bowl is planted by hand at the nursery, so the exact mix varies.",
    light: "bright", water: "low", level: "easy", petSafe: true,
    heightCm: 12, potSizeIn: 8, sizeLabel: "Medium", potIncluded: true, weightKg: W.m, tags: ["gift", "arrangement", "pet-safe"],
  },

  // ─── Herbs & kitchen garden ─────────────────────────
  {
    slug: "tulsi-holy-basil", name: "Tulsi (holy basil)", botanicalName: "Ocimum tenuiflorum", category: "herbs-kitchen-garden",
    price: 149, stock: 70, images: 3, featured: true, sales: 460,
    short: "Rama tulsi for the courtyard, balcony or pooja corner.",
    description: "Tulsi is grown in most Indian homes, for worship and for kadha. It likes sun and regular water, and grows bushier if you pinch off the flower spikes.",
    light: "sun", water: "frequent", level: "easy", petSafe: true,
    heightCm: 30, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["pooja", "herb", "pet-safe", "bestseller"],
  },
  {
    slug: "mint-pudina", name: "Mint (pudina)", botanicalName: "Mentha spicata", category: "herbs-kitchen-garden",
    price: 129, stock: 55, images: 2, sales: 200,
    short: "Grows fast enough for daily chutney. Best in its own pot.",
    description: "Mint spreads quickly, so it's happiest in its own container. Snip sprigs often — regular picking keeps it bushy.",
    light: "indirect", water: "frequent", level: "easy", petSafe: false,
    heightCm: 20, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["herb", "kitchen"],
  },
  {
    slug: "curry-leaf", name: "Curry leaf (kadi patta)", botanicalName: "Murraya koenigii", category: "herbs-kitchen-garden",
    price: 199, compareAt: 249, stock: 40, images: 3, sales: 280,
    short: "Fresh curry leaves for tadka, straight from the balcony.",
    description: "Curry leaf grows into a small shrub that you can harvest for years. Fresh leaves are far more fragrant than store-bought.",
    light: "sun", water: "moderate", level: "easy", petSafe: true,
    notes: "Harvest whole stems rather than individual leaves to encourage branching.",
    heightCm: 35, potSizeIn: 6, sizeLabel: "Medium", weightKg: W.m, tags: ["herb", "kitchen", "pet-safe"],
  },
  {
    slug: "lemongrass", name: "Lemongrass", botanicalName: "Cymbopogon citratus", category: "herbs-kitchen-garden",
    price: 149, stock: 34, images: 2, sales: 90,
    short: "Fragrant grass for chai and soups. Grows into a big clump.",
    description: "Lemongrass grows quickly in sun, forming a tall clump of fragrant blades. Cut a few stalks for chai, soups and kadha.",
    light: "sun", water: "moderate", level: "easy", petSafe: false,
    heightCm: 40, potSizeIn: 8, sizeLabel: "Medium", weightKg: W.l, tags: ["herb", "kitchen", "chai"],
  },
  {
    slug: "ornamental-chilli", name: "Ornamental chilli", botanicalName: "Capsicum annuum", category: "herbs-kitchen-garden",
    price: 179, stock: 18, images: 1, sales: 60,
    short: "Upright chillies that turn purple, orange and red on the same plant.",
    description: "A compact chilli plant grown for its colourful fruit, which ripen through several shades at once. The chillies are edible and very hot.",
    light: "sun", water: "moderate", level: "easy", petSafe: false,
    heightCm: 25, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["kitchen", "colourful"],
  },
  {
    slug: "lemon-plant", name: "Lemon plant (kagzi nimbu)", botanicalName: "Citrus aurantiifolia", category: "herbs-kitchen-garden",
    price: 599, compareAt: 749, stock: 11, images: 3, sales: 100,
    short: "A grafted lemon that fruits in a large pot within a year or two.",
    description: "Grafted kagzi lemon, selected to fruit in containers. Give it a sunny terrace, a big pot and regular feeding.",
    light: "sun", water: "moderate", level: "moderate", petSafe: false,
    heightCm: 60, potSizeIn: 10, sizeLabel: "Large", weightKg: W.xl, tags: ["fruit", "terrace"],
  },

  // ─── Hanging & trailing ─────────────────────────────
  {
    slug: "golden-pothos", name: "Money plant (golden pothos)", botanicalName: "Epipremnum aureum", category: "hanging-trailing",
    price: 199, stock: 90, images: 2, featured: true, sales: 520,
    short: "The money plant. Trails, climbs and grows in water or soil.",
    description: "India's most loved houseplant. It grows in almost any light, in soil or a bottle of water, and trails beautifully from a shelf or climbs a pole.",
    light: "low", water: "moderate", level: "easy", petSafe: false, airPurifying: true,
    heightCm: 25, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["beginner", "lucky", "low-light", "trailing", "bestseller"],
  },
  {
    slug: "marble-queen-pothos", name: "Marble queen money plant", botanicalName: "Epipremnum aureum 'Marble Queen'", category: "hanging-trailing",
    price: 299, stock: 38, images: 2, sales: 170,
    short: "Leaves swirled with cream and green. A lighter, brighter money plant.",
    description: "Marble queen has heavily variegated leaves that look painted. It grows a little slower than golden pothos and likes a bit more light to keep its cream colouring.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false, airPurifying: true,
    heightCm: 25, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["trailing", "variegated"],
  },
  {
    slug: "spider-plant", name: "Spider plant", botanicalName: "Chlorophytum comosum", category: "hanging-trailing",
    price: 199, stock: 44, images: 2, sales: 160,
    short: "Arching striped leaves and dangling baby plants. Safe for pets.",
    description: "Spider plants send out long stems with baby plantlets that dangle like spiders — easy to root and share. They're safe around cats and dogs.",
    light: "indirect", water: "moderate", level: "easy", petSafe: true, airPurifying: true,
    heightCm: 25, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["pet-safe", "beginner", "air-purifying"],
  },
  {
    slug: "english-ivy", name: "English ivy", botanicalName: "Hedera helix", category: "hanging-trailing",
    price: 299, stock: 16, images: 2, sales: 50,
    short: "Classic trailing ivy. Can be trained into shapes on a wire frame.",
    description: "Ivy trails from hanging baskets or climbs frames and trellises. Prefers cooler spots and bright, indirect light.",
    light: "indirect", water: "moderate", level: "moderate", petSafe: false, airPurifying: true,
    heightCm: 30, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["trailing"],
  },
  {
    slug: "tradescantia-zebrina", name: "Tradescantia zebrina", botanicalName: "Tradescantia zebrina", category: "hanging-trailing",
    price: 199, stock: 26, images: 2, sales: 70,
    short: "Purple and silver striped leaves. Grows fast in a hanging pot.",
    description: "Wandering dude, as it's often called, grows quickly and trails. Stems root easily in water, so one plant becomes many.",
    light: "bright", water: "moderate", level: "easy", petSafe: false,
    heightCm: 15, potSizeIn: 5, sizeLabel: "Small", weightKg: W.s, tags: ["trailing", "colourful-foliage"],
  },
  {
    slug: "string-of-pearls", name: "String of pearls", botanicalName: "Curio rowleyanus", category: "hanging-trailing",
    price: 349, stock: 13, images: 2, sales: 95,
    short: "Strands of round, bead-like leaves that cascade over the pot.",
    description: "A trailing succulent with pea-shaped leaves on long strands. Hang it near a bright window and water sparingly.",
    light: "bright", water: "low", level: "moderate", petSafe: false,
    heightCm: 15, potSizeIn: 4, sizeLabel: "Small", weightKg: W.s, tags: ["trailing", "succulent"],
  },
  {
    slug: "string-of-hearts", name: "String of hearts", botanicalName: "Ceropegia woodii", category: "hanging-trailing",
    price: 399, stock: 9, images: 2, sales: 60,
    short: "Tiny heart-shaped leaves on long, purple threads.",
    description: "Delicate strands of silver-marbled hearts that can trail a metre or more. Surprisingly tough; it stores water in small tubers.",
    light: "bright", water: "low", level: "easy", petSafe: true,
    heightCm: 10, potSizeIn: 5, sizeLabel: "Small", potIncluded: true, weightKg: W.s, tags: ["trailing", "pet-safe", "gift"],
  },

  // ─── Bonsai ─────────────────────────────────────────
  {
    slug: "ficus-ginseng-bonsai", name: "Ficus ginseng bonsai", botanicalName: "Ficus microcarpa", category: "bonsai",
    price: 899, compareAt: 1099, stock: 12, images: 2, featured: true, sales: 150,
    short: "A thick, root-like trunk with a neat canopy. The easiest bonsai indoors.",
    description: "Ficus ginseng is the best first bonsai: tolerant of indoor light, quick to recover from pruning, and naturally sculptural thanks to its swollen roots.",
    light: "indirect", water: "moderate", level: "easy", petSafe: false,
    notes: "Trim new shoots back to two leaves to keep the canopy tight.",
    heightCm: 25, potSizeIn: 6, sizeLabel: "Medium", potIncluded: true, weightKg: W.m, tags: ["gift", "desk"],
  },
  {
    slug: "ficus-bonsai-forest", name: "Ficus bonsai, informal upright", botanicalName: "Ficus retusa", category: "bonsai",
    price: 2499, stock: 3, images: 1, sales: 20,
    short: "An older, nursery-trained ficus with a curved trunk. One of a kind.",
    description: "A mature ficus bonsai trained over several years into an informal upright shape. Each tree is individual; the one you receive will be similar to the photo.",
    light: "bright", water: "moderate", level: "moderate", petSafe: false,
    heightCm: 40, potSizeIn: 10, sizeLabel: "Large", potIncluded: true, weightKg: W.l, tags: ["gift", "collector"],
  },
  {
    slug: "jade-bonsai", name: "Jade bonsai", botanicalName: "Portulacaria afra", category: "bonsai",
    price: 1199, stock: 6, images: 2, sales: 40,
    short: "Small round leaves on red-brown branches, styled as a miniature tree.",
    description: "Dwarf jade (elephant bush) makes an excellent bonsai: it's succulent, forgiving of missed waterings, and responds well to pruning.",
    light: "bright", water: "low", level: "easy", petSafe: true,
    heightCm: 30, potSizeIn: 8, sizeLabel: "Medium", potIncluded: true, weightKg: W.l, tags: ["gift", "pet-safe"],
  },
  {
    slug: "juniper-bonsai", name: "Juniper bonsai forest", botanicalName: "Juniperus procumbens", category: "bonsai",
    price: 3999, compareAt: 4499, stock: 2, images: 2, sales: 8,
    short: "A group planting of junipers in a shallow tray. Outdoor bonsai.",
    description: "Several junipers planted together to suggest a small forest. Junipers are outdoor bonsai and need sun on a balcony or terrace.",
    light: "sun", water: "moderate", level: "expert", petSafe: false,
    heightCm: 45, potSizeIn: 14, sizeLabel: "Large", potIncluded: true, weightKg: W.xl, tags: ["collector", "outdoor"],
  },

  // ─── Planters ───────────────────────────────────────
  {
    slug: "terracotta-pot-set", name: "Terracotta pot set of 3", category: "planters",
    price: 499, compareAt: 599, stock: 30, images: 2, sales: 140,
    short: "Unglazed clay pots in 4, 6 and 8 inch. Breathable and classic.",
    description: "Handmade terracotta pots with drainage holes. Clay lets roots breathe and helps prevent overwatering — ideal for succulents, herbs and snake plants.",
    potIncluded: false, sizeLabel: "4, 6 and 8 inch", weightKg: 2.5, tags: ["terracotta", "planter"],
  },
  {
    slug: "hand-painted-ceramic-pot", name: "Hand-painted ceramic pot", category: "planters",
    price: 749, stock: 12, images: 2, sales: 45,
    short: "Glazed pot with a painted floral pattern. Each one slightly different.",
    description: "A 6-inch glazed ceramic planter, hand-painted by artisans. Comes with a drainage hole and cork plug.",
    potIncluded: false, potSizeIn: 6, sizeLabel: "6 inch", weightKg: 1.4, tags: ["ceramic", "planter", "gift"],
  },
  {
    slug: "warli-art-planter", name: "Warli art planter", category: "planters",
    price: 899, compareAt: 999, stock: 8, images: 1, featured: true, sales: 60,
    short: "A cream planter painted with traditional Warli figures.",
    description: "Warli is a tribal art form from Maharashtra. This 7-inch planter is painted by hand with dancing figures in dark brown on cream.",
    potIncluded: false, potSizeIn: 7, sizeLabel: "7 inch", weightKg: 1.8, tags: ["ceramic", "planter", "handmade"],
  },
  {
    slug: "glazed-ceramic-pots", name: "Glazed ceramic pots, set of 2", category: "planters",
    price: 1099, stock: 5, images: 1, sales: 25,
    short: "Two nesting glazed pots in earthy tones, 8 and 10 inch.",
    description: "Frost-proof glazed stoneware pots in muted green and cream. Heavy enough to keep tall plants steady.",
    potIncluded: false, sizeLabel: "8 and 10 inch", weightKg: 5, tags: ["ceramic", "planter"],
  },
];
