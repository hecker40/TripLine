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
  luxury: ["luxury", "upscale", "premium", "five star"],
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
        { time: "2:40 PM", category: "Hotel", district: "Shinjuku", tags: ["hotel"] },
        { time: "5:20 PM", category: "Viewpoint", district: "Shinjuku", tags: ["scenic", "walk"] },
        { time: "7:00 PM", category: "Dinner", district: "Shinjuku", tags: ["food"] },
        { time: "9:00 PM", category: "Nightlife", district: "Shinjuku", tags: ["nightlife", "bar"] },
      ],
    },
    {
      dayName: "Anime & East Side",
      slots: [
        { time: "9:15 AM", category: "Coffee", district: "Kanda", tags: ["coffee"] },
        { time: "11:00 AM", category: "Explore", district: "Akihabara", tags: ["anime", "shopping"] },
        { time: "1:00 PM", category: "Lunch", district: "Akihabara", tags: ["food"] },
        { time: "3:30 PM", category: "Explore", district: "Ueno", tags: ["culture", "nature", "walk"] },
      ],
    },
    {
      dayName: "Asakusa & Immersive Art",
      slots: [
        { time: "9:30 AM", category: "Sightseeing", district: "Asakusa", tags: ["culture", "history"] },
        { time: "11:30 AM", category: "Explore", district: "Asakusa", tags: ["shopping", "walk"] },
        { time: "2:00 PM", category: "Experience", district: "Toyosu", tags: ["art", "immersive"] },
        { time: "6:30 PM", category: "Dinner", district: "Toyosu", tags: ["food", "sushi"] },
      ],
    },
    {
      dayName: "Shibuya, Harajuku & Design",
      slots: [
        { time: "9:00 AM", category: "Coffee", district: "Harajuku", tags: ["coffee"] },
        { time: "10:45 AM", category: "Sightseeing", district: "Harajuku", tags: ["culture", "nature"] },
        { time: "1:00 PM", category: "Lunch", district: "Shibuya", tags: ["food"] },
        { time: "4:15 PM", category: "Viewpoint", district: "Shibuya", tags: ["scenic", "shopping"] },
      ],
    },
    {
      dayName: "Ginza, Museums & Skyline",
      slots: [
        { time: "8:45 AM", category: "Explore", district: "Ginza", tags: ["food", "market"] },
        { time: "11:30 AM", category: "Museum", district: "Aoyama", tags: ["art", "culture"] },
        { time: "2:30 PM", category: "Explore", district: "Daikanyama", tags: ["shopping", "coffee", "design"] },
        { time: "6:00 PM", category: "Viewpoint", district: "Roppongi", tags: ["scenic", "nightlife"] },
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

function parseTravelers(prompt) {
  const match = prompt.match(/(\d+)\s*(?:traveler|travelers|adult|adults|people|friends|guests|kids|children)/i);
  return clamp(match ? Number(match[1]) : 2, 1, 12, 2);
}

function parseBudget(prompt) {
  const match = prompt.match(/\$\s?([\d,]+)/);
  if (match) return Number(match[1].replaceAll(",", ""));
  const plain = prompt.match(/budget\s*(?:of|under|around|is)?\s*([\d,]+)/i);
  if (plain) return Number(plain[1].replaceAll(",", ""));
  if (/luxury/i.test(prompt)) return 4200;
  if (/budget|cheap|affordable/i.test(prompt)) return 1200;
  return 2200;
}

function detectPace(normalizedPrompt) {
  if (/(relaxed|slow|chill|easygoing|laid back|wellness)/.test(normalizedPrompt)) return "Relaxed";
  if (/(fast|packed|ambitious|busy|maximize|sprint)/.test(normalizedPrompt)) return "Fast-paced";
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
  if (compact && compact.split(/\s+/).length <= 4 && !/(budget|day|night|adult|adults|trip|itinerary|travel|food|culture|pace|luxury|family|romantic)/i.test(compact)) {
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

  score -= Math.abs((place.budgetTier ?? 2) - request.budgetBand) * 4;
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
  if (request.interests.includes("nightlife")) prefixes.push("Night Quarter");
  if (request.interests.includes("food")) prefixes.push("Market District");
  if (request.interests.includes("remote")) prefixes.push("Studio Lane");

  const merged = [...new Set([...prefixes, ...DISTRICT_LABELS])];
  return merged.slice(0, 8);
}

function ratingFromSeed(seed) {
  const base = 4.1 + (seed % 8) * 0.1;
  return Number(Math.min(base, 4.9).toFixed(1));
}

function priceFor(kind, budgetBand) {
  const blueprint = KIND_BLUEPRINTS[kind] ?? KIND_BLUEPRINTS.explore;
  return blueprint.priceBands[Math.max(0, Math.min(blueprint.priceBands.length - 1, budgetBand - 1))];
}

function buildGenericPlace(kind, district, request, origin, day, index) {
  const blueprint = KIND_BLUEPRINTS[kind] ?? KIND_BLUEPRINTS.explore;
  const seed = hashString(`${request.destination}-${district}-${kind}-${day}-${index}-${request.prompt}`);
  const label = pickFrom(blueprint.labels, seed);
  const desc = `${pickFrom(blueprint.desc, seed)} In ${origin.displayName}${origin.country ? `, ${origin.country}` : ""}, this slot is tuned to the trip's ${request.pace.toLowerCase()} pace.`;
  const position = offsetCoordinates(origin, seed, 0.012 + day * 0.003 + index * 0.0025);

  return enrichPlace(
    {
      name: `${district} ${label}`,
      category: blueprint.category,
      desc,
      rating: ratingFromSeed(seed),
      price: priceFor(kind, request.budgetBand),
      budgetTier: request.budgetBand,
      district,
      tags: [...new Set([...(blueprint.tags ?? []), kind, ...request.interests.slice(0, 3)])],
      lat: position.lat,
      lng: position.lng,
    },
    origin.displayName,
  );
}

function buildTokyoItinerary(request) {
  const used = new Set();
  const days = [];
  const plans = TOKYO_PROFILE.dayPlans.slice(0, request.days);

  for (const [dayIndex, plan] of plans.entries()) {
    const items = plan.slots.map((slot) => {
      const ranked = TOKYO_PROFILE.places
        .filter((place) => !used.has(place.name))
        .map((place) => ({ place, score: scoreTokyoPlace(place, slot, request) }))
        .sort((left, right) => right.score - left.score);

      const selected = ranked[0]?.score > -9999 ? ranked[0].place : null;
      const fallbackKind = slot.category === "Coffee"
        ? "coffee"
        : slot.category === "Dinner"
          ? "dinner"
          : slot.category === "Lunch"
            ? "lunch"
            : slot.category === "Hotel"
              ? "stay"
              : slot.tags?.includes("nightlife")
                ? "nightlife"
                : slot.tags?.includes("art")
                  ? "art"
                  : slot.tags?.includes("culture")
                    ? "culture"
                    : slot.tags?.includes("scenic")
                      ? "scenic"
                      : "explore";
      const place = selected ? enrichPlace(selected, request.destination) : buildGenericPlace(fallbackKind, slot.district, request, TOKYO_PROFILE.center, dayIndex + 1, 1);
      used.add(place.name);

      return {
        ...place,
        day: dayIndex + 1,
        dayName: plan.dayName,
        time: slot.time,
      };
    });

    days.push({ day: dayIndex + 1, dayName: plan.dayName, items });
  }

  while (days.length < request.days) {
    const day = days.length + 1;
    const district = deriveDistrictPool(request)[day % deriveDistrictPool(request).length];
    const template = ["coffee", "culture", "lunch", request.interests.includes("nightlife") ? "nightlife" : "dinner"];
    const items = template.map((kind, index) => ({
      ...buildGenericPlace(kind, district, request, TOKYO_PROFILE.center, day, index + 1),
      day,
      dayName: `Flexible Day ${day}`,
      time: ["9:00 AM", "11:30 AM", "1:15 PM", "6:30 PM"][index],
    }));

    days.push({ day, dayName: `Flexible Day ${day}`, items });
  }

  return finalizeTrip(request, TOKYO_PROFILE.center, days);
}

function buildDayTemplate(request, day) {
  const nightlifeKind = request.interests.includes("nightlife") && !request.exclusions.noAlcohol ? "nightlife" : "dinner";
  const morningKind = request.interests.includes("remote") ? "remote" : request.interests.includes("coffee") ? "coffee" : "culture";
  const middayKind = request.interests.includes("food") ? "lunch" : request.interests.includes("culture") ? "culture" : "explore";
  const afternoonKind = request.interests.includes("art")
    ? "art"
    : request.interests.includes("nature")
      ? "nature"
      : request.interests.includes("shopping")
        ? "explore"
        : "scenic";
  const eveningKind = request.interests.includes("romance") ? "scenic" : nightlifeKind;

  if (day === 1) {
    return [
      { time: "2:30 PM", kind: "stay" },
      { time: "5:00 PM", kind: request.interests.includes("scenic") ? "scenic" : "explore" },
      { time: "7:15 PM", kind: "dinner" },
      { time: "9:00 PM", kind: eveningKind },
    ];
  }

  return [
    { time: "9:00 AM", kind: morningKind },
    { time: "11:15 AM", kind: request.interests.includes("culture") ? "culture" : "explore" },
    { time: "1:15 PM", kind: middayKind },
    { time: "4:00 PM", kind: afternoonKind },
  ];
}

function buildGenericItinerary(request, origin) {
  const districtPool = deriveDistrictPool(request);
  const days = [];

  for (let day = 1; day <= request.days; day += 1) {
    const slots = buildDayTemplate(request, day);
    const district = districtPool[(day - 1) % districtPool.length];
    const dayName = pickFrom(DAY_THEMES, day - 1).replace("{district}", district);

    const items = slots.map((slot, index) => ({
      ...buildGenericPlace(slot.kind, district, request, origin, day, index + 1),
      day,
      dayName,
      time: slot.time,
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
    `Make this more local and less touristy`,
    `Keep everything train-friendly and walkable`,
  ];

  if (!request.interests.includes("family")) suggestions.push("Make this family friendly");
  if (!request.interests.includes("luxury")) suggestions.push("Turn this into a luxury version");
  if (!request.interests.includes("remote")) suggestions.push("Add cowork-friendly cafes and laptop stops");
  if (!request.interests.includes("romance")) suggestions.push("Make this more romantic");
  if (!request.exclusions.noSeafood) suggestions.push("Swap seafood out completely");
  if (!request.interests.includes("nightlife") && !request.exclusions.noAlcohol) suggestions.push("Add more nightlife");
  if (!request.interests.includes("nature")) suggestions.push("Add an outdoor or park-heavy afternoon");

  return [...new Set(suggestions)].slice(0, 8);
}

function finalizeTrip(request, origin, days) {
  const flatPlaces = days.flatMap((day) => day.items);
  const travelerLabel = `${request.travelers} ${request.travelers === 1 ? "adult" : "adults"}`;
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
    travelerLabel,
    summary: `${flatPlaces.length} routed stops across ${days.length} days, with action links and map popups ready for demo use.`,
    followUpSuggestions: buildFollowUpSuggestions(request, origin),
    route: flatPlaces.map((place) => ({ id: place.id, lat: place.lat, lng: place.lng, day: place.day })),
    days,
  };
}

export async function generateItinerary(rawPrompt = "") {
  const prompt = rawPrompt.trim() || DEFAULT_PROMPT;
  const normalizedPrompt = prompt.toLowerCase();
  const initialDestination = extractDestination(prompt);
  const origin = await resolveOrigin(initialDestination);

  const request = {
    prompt,
    destination: origin.displayName,
    days: parseDays(prompt),
    travelers: parseTravelers(prompt),
    budget: parseBudget(prompt),
    budgetBand: getBudgetBand(parseBudget(prompt)),
    pace: detectPace(normalizedPrompt),
    interests: detectInterests(normalizedPrompt),
    exclusions: detectExclusions(normalizedPrompt),
  };

  if (findKnownCity(origin.displayName) === "tokyo") {
    return { trip: buildTokyoItinerary(request) };
  }

  return { trip: buildGenericItinerary(request, origin) };
}

export { DEFAULT_PROMPT, escapeHtml };
