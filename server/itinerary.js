const DEFAULT_PROMPT = "Plan a balanced 5 day trip to Lisbon for 2 adults with coffee, food, scenic views, and culture";

const CITY_CENTERS = {
  tokyo: { displayName: "Tokyo", country: "Japan", lat: 35.682, lng: 139.7595, departure: "SFO → HND" },
  kyoto: { displayName: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681, departure: "SFO → KIX" },
  seoul: { displayName: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, departure: "SFO → ICN" },
  singapore: { displayName: "Singapore", country: "Singapore", lat: 1.2897, lng: 103.8501, departure: "SFO → SIN" },
  bangkok: { displayName: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, departure: "SFO → BKK" },
  paris: { displayName: "Paris", country: "France", lat: 48.8566, lng: 2.3522, departure: "SFO → CDG" },
  london: { displayName: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276, departure: "SFO → LHR" },
  rome: { displayName: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, departure: "SFO → FCO" },
  lisbon: { displayName: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, departure: "SFO → LIS" },
  barcelona: { displayName: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686, departure: "SFO → BCN" },
  amsterdam: { displayName: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, departure: "SFO → AMS" },
  berlin: { displayName: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, departure: "SFO → BER" },
  istanbul: { displayName: "Istanbul", country: "Türkiye", lat: 41.0082, lng: 28.9784, departure: "SFO → IST" },
  dubai: { displayName: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, departure: "SFO → DXB" },
  "new york": { displayName: "New York City", country: "United States", lat: 40.7128, lng: -74.006, departure: "SFO → JFK" },
  chicago: { displayName: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298, departure: "SFO → ORD" },
  "san francisco": { displayName: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194, departure: "Local or regional arrival" },
  "los angeles": { displayName: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, departure: "SFO → LAX" },
  vancouver: { displayName: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, departure: "SFO → YVR" },
  mexico: { displayName: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, departure: "SFO → MEX" },
  sydney: { displayName: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, departure: "SFO → SYD" },
  melbourne: { displayName: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, departure: "SFO → MEL" },
  auckland: { displayName: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645, departure: "SFO → AKL" },
  cape: { displayName: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, departure: "SFO → CPT" },
  marrakech: { displayName: "Marrakesh", country: "Morocco", lat: 31.6295, lng: -7.9811, departure: "SFO → RAK" },
  rio: { displayName: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, departure: "SFO → GIG" },
  buenos: { displayName: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, departure: "SFO → EZE" },
};

const INTEREST_KEYWORDS = {
  coffee: ["coffee", "cafe", "espresso", "roastery", "matcha"],
  anime: ["anime", "manga", "otaku", "gaming", "arcade"],
  sushi: ["sushi", "omakase"],
  food: ["food", "restaurant", "eat", "dinner", "lunch", "brunch", "ramen", "yakitori", "tapas", "street food", "bakery"],
  culture: ["culture", "temple", "museum", "history", "historic", "shrine", "architecture", "cathedral"],
  shopping: ["shopping", "fashion", "vintage", "stores", "market", "boutiques"],
  nightlife: ["nightlife", "bars", "cocktails", "late night", "club"],
  scenic: ["view", "scenic", "sunset", "skyline", "photography", "lookout"],
  nature: ["park", "garden", "nature", "walk", "hike", "beach"],
  art: ["art", "gallery", "immersive", "design", "creative"],
  family: ["family", "kids", "child", "children"],
  luxury: ["luxury", "upscale", "premium", "five star", "fancy"],
  romance: ["romantic", "couple", "honeymoon"],
  remote: ["cowork", "remote work", "wifi", "laptop", "digital nomad"],
  wellness: ["spa", "wellness", "slow", "relaxing"],
};

const KIND_BLUEPRINTS = {
  stay: {
    category: "Hotel",
    labels: ["Station House Hotel", "Boutique Quarter Stay", "Cityline Suites", "Design Loft Hotel"],
    priceBands: ["$95/night", "$175/night", "$340/night"],
    desc: [
      "A transit-friendly base that keeps the first and last mile friction low for the whole itinerary.",
      "A polished stay placed close to the route spine, so every day starts without wasted motion.",
    ],
    tags: ["hotel"],
  },
  coffee: {
    category: "Coffee",
    labels: ["Roastery Bar", "Espresso Atelier", "Canal Coffee Room", "Morning Brew House"],
    priceBands: ["$5", "$8", "$11"],
    desc: [
      "A strong coffee anchor with the right energy for an early route reset.",
      "An easy first stop for beans, pastries, and a clean launch into the day.",
    ],
    tags: ["coffee"],
  },
  lunch: {
    category: "Lunch",
    labels: ["Market Table", "Neighborhood Lunch Hall", "Counter Kitchen", "Daily Plates Cafe"],
    priceBands: ["$12", "$19", "$34"],
    desc: [
      "A flexible mid-day food stop chosen to keep the route tight and easy to adjust.",
      "A reliable lunch anchor with enough variety to work across most traveler preferences.",
    ],
    tags: ["food"],
  },
  dinner: {
    category: "Dinner",
    labels: ["Signature Supper Club", "Chef's Counter", "Late Table Kitchen", "Local Plates Room"],
    priceBands: ["$24", "$42", "$88"],
    desc: [
      "An evening dining stop intended to feel destination-specific without breaking the route flow.",
      "A stronger dinner moment that gives the day a clear finish instead of a generic meal gap.",
    ],
    tags: ["food"],
  },
  scenic: {
    category: "Viewpoint",
    labels: ["Skyline Deck", "Riverfront Lookout", "Golden Hour Terrace", "Panorama Point"],
    priceBands: ["Free", "$14", "$26"],
    desc: [
      "A visual payoff stop, useful for both pacing and a memorable shareable moment.",
      "A skyline or waterside break designed to give the itinerary a bit more cinematic lift.",
    ],
    tags: ["scenic", "view"],
  },
  culture: {
    category: "Sightseeing",
    labels: ["Heritage Quarter", "Museum Walk", "Landmark Square", "Historic Core Route"],
    priceBands: ["Free", "$12", "$24"],
    desc: [
      "A culture-forward block that helps the trip feel rooted in the city instead of just efficient.",
      "A signature heritage stop with enough context and texture to deepen the route.",
    ],
    tags: ["culture", "history"],
  },
  art: {
    category: "Experience",
    labels: ["Immersive Gallery", "Design Hall", "Modern Art Rooms", "Creative Pavilion"],
    priceBands: ["$16", "$28", "$46"],
    desc: [
      "An art or design-led contrast point, helpful for keeping the itinerary from feeling one-note.",
      "A more visual stop intended to add texture, scale, and a bit of surprise to the trip.",
    ],
    tags: ["art", "design"],
  },
  explore: {
    category: "Explore",
    labels: ["Creative District", "Local Design Streets", "Signature Neighborhood", "Market Lane Circuit"],
    priceBands: ["Free", "$10", "$20"],
    desc: [
      "A flexible exploration block tuned around the strongest part of the surrounding neighborhood.",
      "An easy roam section where the route can breathe without losing direction.",
    ],
    tags: ["shopping", "walk"],
  },
  nature: {
    category: "Sightseeing",
    labels: ["Garden Loop", "Urban Park Walk", "Botanical Pause", "Waterfront Greenway"],
    priceBands: ["Free", "$10", "$18"],
    desc: [
      "A slower green pocket that keeps the pace breathable and the itinerary from overcooking itself.",
      "A softer reset point that helps the trip stay enjoyable over multiple days.",
    ],
    tags: ["nature", "walk"],
  },
  nightlife: {
    category: "Nightlife",
    labels: ["Rooftop Evening", "After-Hours Lounge", "Cocktail Atelier", "Night Market Run"],
    priceBands: ["$16", "$28", "$54"],
    desc: [
      "A low-friction evening option that can lean polished, casual, or lively depending on the trip tone.",
      "A night-cap stop that gives the day a deliberate landing point instead of petering out.",
    ],
    tags: ["nightlife", "bar"],
  },
  remote: {
    category: "Coffee",
    labels: ["Cowork Cafe", "Laptop Bar", "Quiet Work Lounge", "Studio Espresso Lab"],
    priceBands: ["$7", "$12", "$18"],
    desc: [
      "A laptop-friendly stop with Wi‑Fi, outlets, and enough space for a real work block.",
      "A calmer cafe anchor for travelers who need the route to support remote work as well as leisure.",
    ],
    tags: ["coffee", "remote"],
  },
};

const DAY_THEMES = [
  "Arrival & {district}",
  "Local Flavor & {district}",
  "Signature Sights & {district}",
  "Slow Afternoon & {district}",
  "Best Hits & {district}",
  "Neighborhood Drift & {district}",
  "Final Sweep & {district}",
];

const DISTRICT_LABELS = [
  "Historic Core",
  "Creative Quarter",
  "Riverfront",
  "Market District",
  "Design Mile",
  "Old Town",
  "Harbor Front",
  "Gallery Row",
  "Garden Belt",
  "Sunset Ridge",
  "Studio Lane",
  "Night Quarter",
  "Civic Spine",
];

const TOKYO_PROFILE = {
  center: CITY_CENTERS.tokyo,
  dayPlans: [
    {
      dayName: "Arrival & Shinjuku",
      slots: [
        { category: "Hotel", district: "Shinjuku", tags: ["hotel"] },
        { category: "Viewpoint", district: "Shinjuku", tags: ["scenic", "walk"] },
        { category: "Dinner", district: "Shinjuku", tags: ["food"] },
        { category: "Nightlife", district: "Shinjuku", tags: ["nightlife", "bar"] },
      ],
    },
    {
      dayName: "Anime & East Side",
      slots: [
        { category: "Coffee", district: "Kanda", tags: ["coffee"] },
        { category: "Explore", district: "Akihabara", tags: ["anime", "shopping"] },
        { category: "Lunch", district: "Akihabara", tags: ["food"] },
        { category: "Explore", district: "Ueno", tags: ["culture", "nature", "walk"] },
      ],
    },
    {
      dayName: "Asakusa & Immersive Art",
      slots: [
        { category: "Sightseeing", district: "Asakusa", tags: ["culture", "history"] },
        { category: "Explore", district: "Asakusa", tags: ["shopping", "walk"] },
        { category: "Experience", district: "Toyosu", tags: ["art", "immersive"] },
        { category: "Dinner", district: "Toyosu", tags: ["food", "sushi"] },
      ],
    },
    {
      dayName: "Shibuya, Harajuku & Design",
      slots: [
        { category: "Coffee", district: "Harajuku", tags: ["coffee"] },
        { category: "Sightseeing", district: "Harajuku", tags: ["culture", "nature"] },
        { category: "Lunch", district: "Shibuya", tags: ["food"] },
        { category: "Viewpoint", district: "Shibuya", tags: ["scenic", "shopping"] },
      ],
    },
    {
      dayName: "Ginza, Museums & Skyline",
      slots: [
        { category: "Explore", district: "Ginza", tags: ["food", "market"] },
        { category: "Museum", district: "Aoyama", tags: ["art", "culture"] },
        { category: "Explore", district: "Daikanyama", tags: ["shopping", "coffee", "design"] },
        { category: "Viewpoint", district: "Roppongi", tags: ["scenic", "nightlife"] },
      ],
    },
  ],
  places: [
    { name: "Shinjuku Base Hotel", category: "Hotel", desc: "Mid-range tower stay five minutes from the station, easy for late ramen runs and quick train transfers.", rating: 4.4, price: "$185/night", budgetTier: 2, district: "Shinjuku", tags: ["hotel", "mid", "nightlife"], lat: 35.6938, lng: 139.7034 },
    { name: "Shinjuku Capsule Loft", category: "Hotel", desc: "A smart budget sleep pod option with private lockers, good shower rooms, and a super-central location.", rating: 4.1, price: "$78/night", budgetTier: 1, district: "Shinjuku", tags: ["hotel", "budget"], lat: 35.6952, lng: 139.7008 },
    { name: "Shinjuku Skyline Suites", category: "Hotel", desc: "High-floor rooms, polished service, and a quieter edge-of-Shinjuku feel for travelers who want more comfort.", rating: 4.7, price: "$360/night", budgetTier: 3, district: "Shinjuku", tags: ["hotel", "luxury"], lat: 35.6895, lng: 139.6917 },
    { name: "Tokyo Metropolitan Observatory", category: "Viewpoint", desc: "Free skyline stop that gives you a clean first read on the city, especially around golden hour.", rating: 4.5, price: "Free", budgetTier: 1, district: "Shinjuku", tags: ["scenic", "view", "walk"], lat: 35.6896, lng: 139.6917 },
    { name: "Omoide Yokocho", category: "Dinner", desc: "Smoke-scented yakitori alley with tiny counters, fast pours, and the right amount of chaos for a first night.", rating: 4.6, price: "$18", budgetTier: 1, district: "Shinjuku", tags: ["food", "yakitori", "nightlife"], lat: 35.6944, lng: 139.6997 },
    { name: "Golden Gai Cocktail Crawl", category: "Nightlife", desc: "A cluster of tiny bar rooms where one drink per stop is enough to turn the night into a memory.", rating: 4.5, price: "$24", budgetTier: 2, district: "Shinjuku", tags: ["nightlife", "bar", "late"], lat: 35.6941, lng: 139.7047 },
    { name: "Late-Night Matcha Lounge", category: "Nightlife", desc: "A calmer evening alternative with desserts, tea flights, and a softer finish than a bar crawl.", rating: 4.3, price: "$16", budgetTier: 2, district: "Shinjuku", tags: ["nightlife", "coffee", "dessert", "quiet"], lat: 35.6924, lng: 139.7058 },
    { name: "Glitch Coffee Kanda", category: "Coffee", desc: "Single-origin pour-overs with nerdy precision, an easy morning win before diving into the anime district.", rating: 4.8, price: "$7", budgetTier: 2, district: "Kanda", tags: ["coffee", "design"], lat: 35.6956, lng: 139.7709 },
    { name: "Akihabara Electric Town", category: "Explore", desc: "Multi-floor game shops, retro hardware, anime merch, and enough visual noise to fill a full afternoon.", rating: 4.5, price: "Free", budgetTier: 1, district: "Akihabara", tags: ["anime", "shopping", "gaming"], lat: 35.6984, lng: 139.7731 },
    { name: "Kanda Gyoza Stand", category: "Lunch", desc: "Fast crisp-bottom dumplings and cold beer if you want it, close enough to keep the day route tight.", rating: 4.3, price: "$12", budgetTier: 1, district: "Akihabara", tags: ["food", "budget"], lat: 35.6971, lng: 139.7714 },
    { name: "Ueno Park Museum Walk", category: "Explore", desc: "Green breathing room plus museums and shrines, a useful reset after a denser shopping-heavy morning.", rating: 4.5, price: "Free", budgetTier: 1, district: "Ueno", tags: ["culture", "nature", "walk"], lat: 35.7156, lng: 139.773 },
    { name: "Senso-ji Temple", category: "Sightseeing", desc: "Tokyo's oldest temple and one of its best visual arrivals, especially if you approach through Nakamise.", rating: 4.7, price: "Free", budgetTier: 1, district: "Asakusa", tags: ["culture", "history", "temple"], lat: 35.7148, lng: 139.7967 },
    { name: "Kappabashi Kitchen Street", category: "Explore", desc: "A quirky stretch of knife shops, ceramics, and fake food displays that actually makes for great souvenir hunting.", rating: 4.4, price: "Free", budgetTier: 1, district: "Asakusa", tags: ["shopping", "walk", "design"], lat: 35.7141, lng: 139.7899 },
    { name: "teamLab Planets", category: "Experience", desc: "Immersive art rooms with mirrored light, shallow water, and a polished production value that still lands well in a demo.", rating: 4.8, price: "$28", budgetTier: 2, district: "Toyosu", tags: ["art", "immersive", "family"], lat: 35.6465, lng: 139.793 },
    { name: "Toyosu Sushi Counter", category: "Dinner", desc: "Fish-market-adjacent omakase energy, best for travelers who specifically want the seafood flex.", rating: 4.7, price: "$65", budgetTier: 3, district: "Toyosu", tags: ["food", "sushi", "seafood"], lat: 35.6469, lng: 139.7847 },
    { name: "Toyosu Tempura House", category: "Dinner", desc: "Crisp seasonal tempura and rice sets, a safer pick when the group wants something classic without seafood pressure.", rating: 4.4, price: "$26", budgetTier: 2, district: "Toyosu", tags: ["food", "comfort"], lat: 35.6482, lng: 139.7868 },
    { name: "Koffee Mameya Omotesando", category: "Coffee", desc: "Minimalist coffee tasting counter with staff who explain the beans like a sommelier flight.", rating: 4.8, price: "$8", budgetTier: 2, district: "Harajuku", tags: ["coffee", "design"], lat: 35.6669, lng: 139.7103 },
    { name: "Meiji Jingu Forest Walk", category: "Sightseeing", desc: "A calm cedar-lined shrine approach that gives the day some air before dropping back into fashion and crowds.", rating: 4.7, price: "Free", budgetTier: 1, district: "Harajuku", tags: ["culture", "nature", "walk"], lat: 35.6764, lng: 139.6993 },
    { name: "Shibuya Gyoza Lounge", category: "Lunch", desc: "An easy lunch reset in the middle of the buzz, quick service and sharable plates.", rating: 4.2, price: "$14", budgetTier: 1, district: "Shibuya", tags: ["food", "budget"], lat: 35.6605, lng: 139.702 },
    { name: "Shibuya Sky", category: "Viewpoint", desc: "The cleanest big-city payoff in Tokyo, especially when you time it for late-afternoon light over the crossing.", rating: 4.8, price: "$21", budgetTier: 2, district: "Shibuya", tags: ["scenic", "view", "shopping"], lat: 35.6595, lng: 139.7005 },
    { name: "Tsukiji Outer Market", category: "Explore", desc: "Snacks, skewers, knife shops, and low-friction breakfast grazing when you want a stronger food-forward start.", rating: 4.5, price: "$22", budgetTier: 2, district: "Ginza", tags: ["food", "market", "seafood"], lat: 35.6655, lng: 139.7708 },
    { name: "Nezu Museum", category: "Museum", desc: "Compact, elegant, and paired with a great garden, one of the easier art stops to actually enjoy.", rating: 4.6, price: "$10", budgetTier: 2, district: "Aoyama", tags: ["art", "culture", "design"], lat: 35.6646, lng: 139.7245 },
    { name: "Daikanyama T-Site", category: "Explore", desc: "A design-forward bookstore complex with excellent browsing and a relaxed neighborhood feel.", rating: 4.6, price: "Free", budgetTier: 1, district: "Daikanyama", tags: ["shopping", "coffee", "design"], lat: 35.6481, lng: 139.7041 },
    { name: "Roppongi Hills Sky Deck", category: "Viewpoint", desc: "A dramatic last-night skyline stop, especially when you want the city to feel a bit more cinematic.", rating: 4.7, price: "$18", budgetTier: 2, district: "Roppongi", tags: ["scenic", "nightlife", "view"], lat: 35.6605, lng: 139.7292 },
  ],
};

const geocodeCache = new Map();

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function parseDays(prompt) {
  if (/weekend/i.test(prompt)) return 3;
  const match = prompt.match(/(\d+)\s*(?:day|days|night|nights)/i);
  return clamp(match ? Number(match[1]) : 5, 2, 10, 5);
}

function parseAdults(prompt) {
  const adultsMatch = prompt.match(/(\d+)\s*adults?/i);
  if (adultsMatch) return clamp(Number(adultsMatch[1]), 1, 12, 2);

  const generic = prompt.match(/(\d+)\s*(?:traveler|travelers|people|friends|guests)/i);
  return clamp(generic ? Number(generic[1]) : 2, 1, 12, 2);
}

function parseKids(prompt) {
  const kidsMatch = prompt.match(/(\d+)\s*(?:kid|kids|child|children)/i);
  if (kidsMatch) return clamp(Number(kidsMatch[1]), 0, 8, 0);
  if (/with kids|with a kid|with children|kid-friendly|family-friendly|family trip/i.test(prompt)) return 2;
  return 0;
}

function parseBudget(prompt) {
  const match = prompt.match(/\$\s?([\d,]+)/);
  if (match) return Number(match[1].replaceAll(",", ""));
  const plain = prompt.match(/budget\s*(?:of|under|around|is)?\s*([\d,]+)/i);
  if (plain) return Number(plain[1].replaceAll(",", ""));
  if (/luxury|fancy/i.test(prompt)) return 4200;
  if (/budget|cheap|affordable|casual/i.test(prompt)) return 1200;
  return 2200;
}

function detectPace(normalizedPrompt) {
  if (/(relaxed|slow|chill|easygoing|laid back|wellness)/.test(normalizedPrompt)) return "Relaxed";
  if (/(fast|packed|ambitious|busy|maximize|sprint)/.test(normalizedPrompt)) return "Fast-paced";
  return "Balanced";
}

function detectStyle(normalizedPrompt) {
  if (/(luxury|fancy|upscale|premium|elevated|polished)/.test(normalizedPrompt)) return "Fancy";
  if (/(casual|laid back|low key|low-key|budget|easygoing)/.test(normalizedPrompt)) return "Casual";
  return "Balanced";
}

function detectExclusions(normalizedPrompt) {
  return {
    noSeafood: /(no seafood|don't like seafood|do not like seafood|hate seafood|allergic to seafood)/.test(normalizedPrompt),
    noAlcohol: /(no alcohol|don't drink|do not drink|sober)/.test(normalizedPrompt),
    vegetarian: /(vegetarian|no meat)/.test(normalizedPrompt),
  };
}

function detectInterests(normalizedPrompt) {
  const interests = new Set();
  for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    if (keywords.some((word) => normalizedPrompt.includes(word))) interests.add(interest);
  }

  if (!interests.size) {
    interests.add("food");
    interests.add("culture");
    interests.add("scenic");
    interests.add("coffee");
  }

  return [...interests];
}

function findKnownCity(value) {
  const normalized = value.toLowerCase();
  const entries = Object.keys(CITY_CENTERS).sort((left, right) => right.length - left.length);
  return entries.find((key) => normalized.includes(key)) ?? null;
}

function extractDestination(prompt) {
  const known = findKnownCity(prompt);
  if (known) return CITY_CENTERS[known].displayName;

  const compact = prompt.trim();
  if (compact && compact.split(/\s+/).length <= 4 && !/(budget|day|night|adult|adults|trip|itinerary|travel|food|culture|pace|luxury|family|romantic|wake|sleep|kids)/i.test(compact)) {
    return titleCase(compact);
  }

  const matchers = [
    /(?:trip|itinerary|travel|vacation)\s+(?:to|for|in)\s+([A-Za-z][A-Za-z\s,'-]+)/i,
    /(?:to|in|for|visiting)\s+([A-Za-z][A-Za-z\s,'-]+)/i,
  ];

  for (const matcher of matchers) {
    const match = prompt.match(matcher);
    if (match?.[1]) {
      const cleaned = match[1].split(/(?:with|under|budget|for|and|,|\.)/i)[0].trim();
      if (cleaned) return titleCase(cleaned);
    }
  }

  return "Lisbon";
}

function parseTimeString(value) {
  if (!value) return null;
  const match = String(value).trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!meridiem && hours <= 12) hours %= 24;

  return clamp(hours * 60 + minutes, 0, 1439, 0);
}

function formatMinutes(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function toTimeInput(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeStyle(value, fallback = "Balanced") {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "fancy") return "Fancy";
  if (normalized === "casual") return "Casual";
  return "Balanced";
}

function normalizePace(value, fallback = "Balanced") {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "relaxed") return "Relaxed";
  if (normalized === "fast-paced" || normalized === "fast paced" || normalized === "fast") return "Fast-paced";
  return "Balanced";
}

function resolveNumberPreference(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(numeric, min, max, fallback);
}

function extractTimePreference(prompt, type) {
  const patterns = type === "wake"
    ? [
        /wake(?:\s*up)?\s*(?:around|at)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
        /start(?:ing)?\s*(?:around|at)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      ]
    : [
        /sleep\s*(?:around|at|by)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
        /bed(?:time)?\s*(?:around|at|by)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      return parseTimeString(match[1]);
    }
  }

  return null;
}

function getWakeMinutes(prompt, kids) {
  return extractTimePreference(prompt, "wake") ?? (kids > 0 ? 8 * 60 : 9 * 60);
}

function getSleepMinutes(prompt, kids) {
  return extractTimePreference(prompt, "sleep") ?? (kids > 0 ? 21 * 60 + 30 : 23 * 60);
}

function getBudgetBand(amount) {
  if (amount <= 1400) return 1;
  if (amount >= 3500) return 3;
  return 2;
}

function buildSearchLink(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildMapsLink(name, destination) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${destination}`)}`;
}

function buildPrimaryLink(place, destination) {
  if (place.category === "Hotel") {
    return { label: "Book stay", href: buildSearchLink(`${place.name} ${destination} booking`) };
  }

  if (["Dinner", "Lunch", "Nightlife"].includes(place.category)) {
    return { label: "Reserve", href: buildSearchLink(`${place.name} ${destination} reservation`) };
  }

  if (["Experience", "Viewpoint", "Museum", "Sightseeing"].includes(place.category)) {
    return { label: "Get tickets", href: buildSearchLink(`${place.name} ${destination} tickets`) };
  }

  return { label: "View details", href: buildSearchLink(`${place.name} ${destination}`) };
}

function enrichPlace(place, destination) {
  return {
    ...place,
    id: slugify(`${destination}-${place.name}`),
    tag: place.category,
    stars: Math.max(1, Math.min(5, Math.round(place.rating))),
    img: place.img ?? `https://picsum.photos/seed/${slugify(`${destination}-${place.name}`)}/640/420`,
    mapsUrl: buildMapsLink(place.name, destination),
    primaryLink: buildPrimaryLink(place, destination),
  };
}

function placeBlocked(place, exclusions) {
  const tags = new Set(place.tags ?? []);
  if (exclusions.noSeafood && tags.has("seafood")) return true;
  if (exclusions.noAlcohol && tags.has("bar")) return true;
  if (exclusions.vegetarian && (tags.has("seafood") || tags.has("yakitori"))) return true;
  return false;
}

function scoreTokyoPlace(place, slot, request) {
  if (placeBlocked(place, request.exclusions)) return -10_000;

  let score = 0;
  if (place.category === slot.category) score += 20;
  if (place.district === slot.district) score += 18;
  for (const tag of slot.tags ?? []) {
    if ((place.tags ?? []).includes(tag)) score += 8;
  }
  for (const interest of request.interests) {
    if ((place.tags ?? []).includes(interest)) score += 4;
  }

  score -= Math.abs((place.budgetTier ?? 2) - request.styleBudgetBand) * 4;
  if (request.style === "Fancy" && (place.tags ?? []).includes("luxury")) score += 8;
  if (request.style === "Casual" && (place.tags ?? []).includes("budget")) score += 6;
  if (request.kids > 0 && (place.tags ?? []).includes("family")) score += 8;

  return score + place.rating;
}

function offsetCoordinates(origin, seed, radius = 0.018) {
  const latitudeFactor = Math.max(Math.cos((origin.lat * Math.PI) / 180), 0.35);
  const angle = (seed % 360) * (Math.PI / 180);
  return {
    lat: Number((origin.lat + Math.sin(angle) * radius).toFixed(6)),
    lng: Number((origin.lng + (Math.cos(angle) * radius) / latitudeFactor).toFixed(6)),
  };
}

function pickFrom(list, seed) {
  return list[seed % list.length];
}

function deriveDistrictPool(request) {
  const prefixes = [];
  if (request.interests.includes("culture")) prefixes.push("Historic Core");
  if (request.interests.includes("art")) prefixes.push("Gallery Row");
  if (request.interests.includes("shopping")) prefixes.push("Design Mile");
  if (request.interests.includes("nature")) prefixes.push("Garden Belt");
  if (request.interests.includes("nightlife") && request.kids === 0 && !request.exclusions.noAlcohol) prefixes.push("Night Quarter");
  if (request.interests.includes("food")) prefixes.push("Market District");
  if (request.interests.includes("remote")) prefixes.push("Studio Lane");

  const merged = [...new Set([...prefixes, ...DISTRICT_LABELS])];
  return merged.slice(0, 8);
}

function ratingFromSeed(seed) {
  const base = 4.1 + (seed % 8) * 0.1;
  return Number(Math.min(base, 4.9).toFixed(1));
}

function priceFor(kind, request) {
  const blueprint = KIND_BLUEPRINTS[kind] ?? KIND_BLUEPRINTS.explore;
  return blueprint.priceBands[Math.max(0, Math.min(blueprint.priceBands.length - 1, request.styleBudgetBand - 1))];
}

function stylePhrase(style) {
  if (style === "Fancy") return "The stop leans polished and premium rather than merely convenient.";
  if (style === "Casual") return "The stop leans easygoing, practical, and low-friction rather than dressy.";
  return "The stop stays balanced between ease, quality, and polish.";
}

function buildGenericPlace(kind, district, request, origin, day, index) {
  const blueprint = KIND_BLUEPRINTS[kind] ?? KIND_BLUEPRINTS.explore;
  const seed = hashString(`${request.destination}-${district}-${kind}-${day}-${index}-${request.prompt}`);
  const label = pickFrom(blueprint.labels, seed);
  const desc = `${pickFrom(blueprint.desc, seed)} In ${origin.displayName}${origin.country ? `, ${origin.country}` : ""}, this slot is tuned to the trip's ${request.pace.toLowerCase()} pace. ${stylePhrase(request.style)}`;
  const position = offsetCoordinates(origin, seed, 0.012 + day * 0.003 + index * 0.0025);

  return enrichPlace(
    {
      name: `${district} ${label}`,
      category: blueprint.category,
      desc,
      rating: ratingFromSeed(seed),
      price: priceFor(kind, request),
      budgetTier: request.styleBudgetBand,
      district,
      tags: [...new Set([...(blueprint.tags ?? []), kind, ...request.interests.slice(0, 3), request.kids > 0 ? "family" : "adult"] )],
      lat: position.lat,
      lng: position.lng,
    },
    origin.displayName,
  );
}

function personalizeTokyoPlans(request) {
  const renamedFirstDay = request.hasArrivalDay ? "Arrival & Shinjuku" : "Shinjuku & Skyline";

  return TOKYO_PROFILE.dayPlans.map((plan, planIndex) => ({
    ...plan,
    dayName: planIndex === 0 ? renamedFirstDay : plan.dayName,
    slots: plan.slots.map((slot, slotIndex) => {
      if (planIndex === 0 && slotIndex === 3) {
        return request.kids > 0 || request.exclusions.noAlcohol || request.sleepMinutes < 22 * 60
          ? { category: "Explore", district: "Shinjuku", tags: ["family", "dessert", "walk"] }
          : slot;
      }
      return slot;
    }),
  }));
}

function inferFallbackKind(slot) {
  if (slot.category === "Coffee") return "coffee";
  if (slot.category === "Dinner") return "dinner";
  if (slot.category === "Lunch") return "lunch";
  if (slot.category === "Hotel") return "stay";
  if (slot.category === "Nightlife") return "nightlife";
  if (slot.tags?.includes("art")) return "art";
  if (slot.tags?.includes("culture")) return "culture";
  if (slot.tags?.includes("scenic")) return "scenic";
  if (slot.tags?.includes("nature") || slot.tags?.includes("family")) return "nature";
  return "explore";
}

function buildTokyoItinerary(request) {
  const used = new Set();
  const days = [];
  const plans = personalizeTokyoPlans(request).slice(0, request.days);

  for (const [dayIndex, plan] of plans.entries()) {
    const items = plan.slots.map((slot, itemIndex) => {
      const ranked = TOKYO_PROFILE.places
        .filter((place) => !used.has(place.name))
        .map((place) => ({ place, score: scoreTokyoPlace(place, slot, request) }))
        .sort((left, right) => right.score - left.score);

      const selected = ranked[0]?.score > -9999 ? ranked[0].place : null;
      const place = selected
        ? enrichPlace(selected, request.destination)
        : buildGenericPlace(inferFallbackKind(slot), slot.district, request, TOKYO_PROFILE.center, dayIndex + 1, itemIndex + 1);
      used.add(place.name);

      return {
        ...place,
        day: dayIndex + 1,
        dayName: plan.dayName,
      };
    });

    days.push({ day: dayIndex + 1, dayName: plan.dayName, items });
  }

  while (days.length < request.days) {
    const day = days.length + 1;
    const district = deriveDistrictPool(request)[day % deriveDistrictPool(request).length];
    const template = ["coffee", request.kids > 0 ? "nature" : "culture", "lunch", request.kids > 0 ? "scenic" : (request.interests.includes("nightlife") && request.kids === 0 ? "nightlife" : "dinner")];
    const items = template.map((kind, index) => ({
      ...buildGenericPlace(kind, district, request, TOKYO_PROFILE.center, day, index + 1),
      day,
      dayName: `Flexible Day ${day}`,
    }));

    days.push({ day, dayName: `Flexible Day ${day}`, items });
  }

  return finalizeTrip(request, TOKYO_PROFILE.center, days);
}

function buildDayTemplate(request, day) {
  const eveningKind = request.kids > 0 || request.exclusions.noAlcohol || request.sleepMinutes < 22 * 60
    ? (request.interests.includes("scenic") ? "scenic" : "dinner")
    : (request.interests.includes("nightlife") && request.sleepMinutes >= 22 * 60 + 30 ? "nightlife" : "dinner");
  const morningKind = request.interests.includes("remote") ? "remote" : (request.interests.includes("coffee") ? "coffee" : "culture");
  const middayKind = request.style === "Casual"
    ? "lunch"
    : request.interests.includes("food")
      ? "lunch"
      : (request.interests.includes("culture") ? "culture" : "explore");
  const afternoonKind = request.kids > 0
    ? (request.interests.includes("nature") ? "nature" : "explore")
    : request.style === "Fancy"
      ? (request.interests.includes("art") ? "art" : "scenic")
      : request.interests.includes("art")
        ? "art"
        : request.interests.includes("nature")
          ? "nature"
          : request.interests.includes("shopping")
            ? "explore"
            : "scenic";

  if (day === 1) {
    if (request.hasArrivalDay) {
      return ["stay", request.interests.includes("scenic") ? "scenic" : "explore", "dinner", eveningKind];
    }
    return [morningKind, request.interests.includes("culture") ? "culture" : "explore", middayKind, afternoonKind];
  }

  return [morningKind, request.interests.includes("culture") ? "culture" : "explore", middayKind, afternoonKind];
}

function getDayStartMinutes(request) {
  return request.wakeMinutes + (request.kids > 0 ? 45 : request.pace === "Fast-paced" ? 35 : 60);
}

function targetTimeForCategory(item, itemIndex, request, isArrivalDay) {
  const category = item.category || item.tag || "Explore";
  const wake = request.wakeMinutes;
  const sleep = request.sleepMinutes;
  const start = getDayStartMinutes(request);
  const lunchTime = Math.max(start + 120, wake + 240);
  const dinnerTime = Math.min(sleep - 150, Math.max(wake + 570, 18 * 60 + 30));
  const nightlifeTime = Math.min(sleep - 75, Math.max(wake + 690, 21 * 60));
  const lateAfternoon = Math.min(sleep - 210, Math.max(wake + 420, 16 * 60));
  const midMorning = Math.max(start + 90, wake + 150);

  if (isArrivalDay) {
    if (category === "Hotel") return Math.max(14 * 60, wake + 180);
    if (category === "Dinner") return Math.min(sleep - 150, 19 * 60 + 15);
    if (category === "Nightlife") return Math.min(sleep - 75, 21 * 60);
    if (["Viewpoint", "Experience"].includes(category)) return Math.min(sleep - 210, 17 * 60);
    return Math.max(16 * 60, wake + 270 + itemIndex * 60);
  }

  if (category === "Hotel") return Math.max(start, wake + 90);
  if (category === "Coffee") return Math.max(start, wake + 60);
  if (category === "Lunch") return lunchTime;
  if (category === "Dinner") return dinnerTime;
  if (category === "Nightlife") return nightlifeTime;
  if (["Museum", "Sightseeing"].includes(category)) return midMorning;
  if (["Experience", "Viewpoint"].includes(category)) return lateAfternoon;
  if (category === "Explore") return itemIndex <= 1 ? midMorning : lateAfternoon;
  return start + itemIndex * 135;
}

function applyScheduleToDays(days, request) {
  return days.map((day, index) => {
    const isArrivalDay = index === 0 && request.hasArrivalDay;

    const rawTimes = day.items.map((item, itemIndex) => targetTimeForCategory(item, itemIndex, request, isArrivalDay));
    const normalizedTimes = rawTimes.map((time, itemIndex) => {
      if (itemIndex === 0) return time;
      return Math.max(time, rawTimes[itemIndex - 1] + 75);
    });

    return {
      ...day,
      items: day.items.map((item, itemIndex) => ({
        ...item,
        time: formatMinutes(normalizedTimes[itemIndex] ?? (9 * 60 + itemIndex * 120)),
      })),
    };
  });
}

function buildGenericItinerary(request, origin) {
  const districtPool = deriveDistrictPool(request);
  const days = [];

  for (let day = 1; day <= request.days; day += 1) {
    const template = buildDayTemplate(request, day);
    const district = districtPool[(day - 1) % districtPool.length];
    const dayName = pickFrom(DAY_THEMES, day - 1).replace("{district}", district);

    const items = template.map((kind, index) => ({
      ...buildGenericPlace(kind, district, request, origin, day, index + 1),
      day,
      dayName,
    }));

    days.push({ day, dayName, items });
  }

  return finalizeTrip(request, origin, days);
}

async function resolveOrigin(destination) {
  const knownKey = findKnownCity(destination);
  if (knownKey) {
    return CITY_CENTERS[knownKey];
  }

  const cacheKey = slugify(destination);
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(destination)}`;
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "TripLineDemo/1.0 (local development itinerary generator)",
      },
    });

    if (response.ok) {
      const results = await response.json();
      const match = results?.[0];
      if (match) {
        const parts = String(match.display_name).split(",").map((part) => part.trim()).filter(Boolean);
        const resolved = {
          displayName: parts[0] || titleCase(destination),
          country: match.address?.country || parts.at(-1) || "",
          lat: Number(match.lat),
          lng: Number(match.lon),
          departure: "Flexible arrival",
        };
        geocodeCache.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch {
    // Fallback below.
  }

  const fallback = { ...CITY_CENTERS.lisbon, displayName: titleCase(destination) };
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

function buildFollowUpSuggestions(request, origin) {
  const suggestions = [
    `Make this cheaper in ${origin.displayName}`,
    "Make this more local and less touristy",
    "Keep everything train-friendly and walkable",
  ];

  if (!request.interests.includes("family")) suggestions.push("Make this family friendly");
  if (!request.interests.includes("luxury") && request.style !== "Fancy") suggestions.push("Turn this into a fancy version");
  if (!request.interests.includes("remote")) suggestions.push("Add cowork-friendly cafes and laptop stops");
  if (!request.interests.includes("romance")) suggestions.push("Make this more romantic");
  if (!request.exclusions.noSeafood) suggestions.push("Swap seafood out completely");
  if (!request.interests.includes("nightlife") && request.kids === 0 && !request.exclusions.noAlcohol) suggestions.push("Add more nightlife");
  if (!request.interests.includes("nature")) suggestions.push("Add an outdoor or park-heavy afternoon");
  if (request.wakeMinutes < 9 * 60) suggestions.push("Start the days later, nothing before 10 AM");
  if (request.sleepMinutes > 22 * 60 + 30 && request.kids === 0) suggestions.push("Push one night later with rooftop drinks");

  return [...new Set(suggestions)].slice(0, 8);
}

function buildTravelerLabel(request) {
  if (request.kids > 0) {
    return `${request.adults} adults · ${request.kids} ${request.kids === 1 ? "kid" : "kids"}`;
  }
  return `${request.adults} ${request.adults === 1 ? "adult" : "adults"}`;
}

function finalizeTrip(request, origin, rawDays) {
  const days = applyScheduleToDays(rawDays, request);
  const flatPlaces = days.flatMap((day) => day.items);
  const focus = request.interests.slice(0, 4).join(", ");
  const exclusions = [];
  if (request.exclusions.noSeafood) exclusions.push("seafood removed");
  if (request.exclusions.noAlcohol) exclusions.push("alcohol-light evenings");
  if (request.exclusions.vegetarian) exclusions.push("vegetarian-friendly swaps");

  return {
    request,
    title: `${request.days} Days in ${origin.displayName}`,
    subtitle: `A ${request.pace.toLowerCase()} itinerary built around ${focus || "smart local highlights"}${exclusions.length ? `, with ${exclusions.join(" and ")}` : ""}.`,
    badge: `Mapped itinerary · ${origin.displayName}`,
    destination: origin.displayName,
    country: origin.country,
    departure: origin.departure || "Flexible arrival",
    budgetLabel: `$${request.budget.toLocaleString()} total`,
    paceLabel: request.pace,
    travelerLabel: buildTravelerLabel(request),
    summary: `${flatPlaces.length} routed stops across ${days.length} days, with day-by-day trail lines, action links, and map popups ready for demo use.`,
    followUpSuggestions: buildFollowUpSuggestions(request, origin),
    preferences: {
      days: request.days,
      budget: request.budget,
      adults: request.adults,
      kids: request.kids,
      withKids: request.kids > 0,
      wakeTime: formatMinutes(request.wakeMinutes),
      sleepTime: formatMinutes(request.sleepMinutes),
      wakeTimeValue: toTimeInput(request.wakeMinutes),
      sleepTimeValue: toTimeInput(request.sleepMinutes),
      style: request.style,
      pace: request.pace,
    },
    route: flatPlaces.map((place) => ({ id: place.id, lat: place.lat, lng: place.lng, day: place.day })),
    days,
  };
}

export async function generateItinerary(rawPrompt = "", explicitPreferences = {}) {
  const prompt = rawPrompt.trim() || DEFAULT_PROMPT;
  const normalizedPrompt = prompt.toLowerCase();
  const initialDestination = extractDestination(prompt);
  const origin = await resolveOrigin(initialDestination);

  const promptDays = parseDays(prompt);
  const promptBudget = parseBudget(prompt);
  const promptAdults = parseAdults(prompt);
  const promptKids = parseKids(prompt);
  const adults = resolveNumberPreference(explicitPreferences.adults, promptAdults, 1, 12);
  const kids = resolveNumberPreference(explicitPreferences.kids, promptKids, 0, 8);
  const days = resolveNumberPreference(explicitPreferences.days, promptDays, 2, 10);
  const budget = resolveNumberPreference(explicitPreferences.budget, promptBudget, 300, 25000);
  const wakeMinutes = parseTimeString(explicitPreferences.wakeTime) ?? getWakeMinutes(prompt, kids);
  const sleepMinutes = parseTimeString(explicitPreferences.sleepTime) ?? getSleepMinutes(prompt, kids);
  const pace = normalizePace(explicitPreferences.pace, detectPace(normalizedPrompt));
  const style = normalizeStyle(explicitPreferences.style, detectStyle(normalizedPrompt));
  const baseBudgetBand = getBudgetBand(budget);
  const styleBudgetBand = clamp(baseBudgetBand + (style === "Fancy" ? 1 : style === "Casual" ? -1 : 0), 1, 3, baseBudgetBand);

  const request = {
    prompt,
    destination: origin.displayName,
    days,
    adults,
    kids,
    travelers: adults + kids,
    budget,
    budgetBand: baseBudgetBand,
    styleBudgetBand,
    pace,
    style,
    interests: detectInterests(normalizedPrompt),
    exclusions: detectExclusions(normalizedPrompt),
    wakeMinutes,
    sleepMinutes,
    hasArrivalDay: /(arrival|landing|land\s+in|check[- ]?in|after\s+flight|flight\s+day)/i.test(prompt),
  };

  if (kids > 0 && !request.interests.includes("family")) {
    request.interests = [...request.interests, "family"];
  }

  if (findKnownCity(origin.displayName) === "tokyo") {
    return { trip: buildTokyoItinerary(request) };
  }

  return { trip: buildGenericItinerary(request, origin) };
}

export { DEFAULT_PROMPT, escapeHtml };