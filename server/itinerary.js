const CITY_CENTERS = {
  tokyo: { displayName: "Tokyo", country: "Japan", lat: 35.682, lng: 139.7595, departure: "SFO → HND" },
  kyoto: { displayName: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681, departure: "SFO → KIX" },
  seoul: { displayName: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, departure: "SFO → ICN" },
  paris: { displayName: "Paris", country: "France", lat: 48.8566, lng: 2.3522, departure: "SFO → CDG" },
  london: { displayName: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276, departure: "SFO → LHR" },
  rome: { displayName: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, departure: "SFO → FCO" },
  barcelona: { displayName: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686, departure: "SFO → BCN" },
  "new york": { displayName: "New York City", country: "United States", lat: 40.7128, lng: -74.006, departure: "SFO → JFK" },
  "san francisco": { displayName: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194, departure: "Local or regional arrival" },
  "los angeles": { displayName: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, departure: "SFO → LAX" },
};

const INTEREST_KEYWORDS = {
  coffee: ["coffee", "cafe", "espresso", "roastery"],
  anime: ["anime", "manga", "otaku", "gaming", "arcade"],
  sushi: ["sushi", "omakase"],
  food: ["food", "restaurant", "eat", "dinner", "lunch", "ramen", "yakitori", "street food"],
  culture: ["culture", "temple", "museum", "history", "historic", "shrine"],
  shopping: ["shopping", "fashion", "vintage", "stores", "market"],
  nightlife: ["nightlife", "bars", "cocktails", "late night", "club"],
  scenic: ["view", "scenic", "sunset", "skyline", "photography"],
  nature: ["park", "garden", "nature", "walk"],
  art: ["art", "gallery", "immersive", "design"],
  family: ["family", "kids", "child", "children"],
  luxury: ["luxury", "upscale", "premium"],
  romance: ["romantic", "couple", "honeymoon"],
};

const TOKYO_PROFILE = {
  key: "tokyo",
  center: CITY_CENTERS.tokyo,
  defaultInterests: ["coffee", "anime", "food", "culture", "scenic"],
  dayPlans: [
    {
      dayName: "Arrival & Shinjuku",
      slots: [
        { time: "2:40 PM", category: "Hotel", district: "Shinjuku", tags: ["hotel"] },
        { time: "5:20 PM", district: "Shinjuku", tags: ["scenic", "nightlife", "walk"] },
        { time: "7:00 PM", category: "Dinner", district: "Shinjuku", tags: ["food"] },
        { time: "9:00 PM", district: "Shinjuku", tags: ["nightlife", "bar"] },
      ],
    },
    {
      dayName: "Anime & East Side",
      slots: [
        { time: "9:15 AM", category: "Coffee", district: "Kanda", tags: ["coffee"] },
        { time: "11:00 AM", district: "Akihabara", tags: ["anime", "shopping"] },
        { time: "1:00 PM", category: "Lunch", district: "Akihabara", tags: ["food"] },
        { time: "3:30 PM", district: "Ueno", tags: ["culture", "nature", "walk"] },
      ],
    },
    {
      dayName: "Asakusa & Immersive Art",
      slots: [
        { time: "9:30 AM", district: "Asakusa", tags: ["culture", "history"] },
        { time: "11:30 AM", district: "Asakusa", tags: ["shopping", "walk"] },
        { time: "2:00 PM", district: "Toyosu", tags: ["art", "immersive"] },
        { time: "6:30 PM", category: "Dinner", district: "Toyosu", tags: ["food", "sushi"] },
      ],
    },
    {
      dayName: "Shibuya, Harajuku & Design",
      slots: [
        { time: "9:00 AM", category: "Coffee", district: "Harajuku", tags: ["coffee"] },
        { time: "10:45 AM", district: "Harajuku", tags: ["culture", "nature"] },
        { time: "1:00 PM", category: "Lunch", district: "Shibuya", tags: ["food"] },
        { time: "4:15 PM", district: "Shibuya", tags: ["scenic", "shopping"] },
      ],
    },
    {
      dayName: "Ginza, Museums & Skyline",
      slots: [
        { time: "8:45 AM", district: "Ginza", tags: ["food", "market"] },
        { time: "11:30 AM", district: "Aoyama", tags: ["art", "culture"] },
        { time: "2:30 PM", district: "Daikanyama", tags: ["shopping", "coffee", "design"] },
        { time: "6:00 PM", district: "Roppongi", tags: ["scenic", "nightlife"] },
      ],
    },
  ],
  places: [
    {
      name: "Shinjuku Base Hotel",
      category: "Hotel",
      desc: "Mid-range tower stay five minutes from the station, easy for late ramen runs and quick train transfers.",
      rating: 4.4,
      price: "$185/night",
      budgetTier: 2,
      district: "Shinjuku",
      tags: ["hotel", "mid", "nightlife"],
      lat: 35.6938,
      lng: 139.7034,
    },
    {
      name: "Shinjuku Capsule Loft",
      category: "Hotel",
      desc: "A smart budget sleep pod option with private lockers, good shower rooms, and a super-central location.",
      rating: 4.1,
      price: "$78/night",
      budgetTier: 1,
      district: "Shinjuku",
      tags: ["hotel", "budget"],
      lat: 35.6952,
      lng: 139.7008,
    },
    {
      name: "Shinjuku Skyline Suites",
      category: "Hotel",
      desc: "High-floor rooms, polished service, and a quieter edge-of-Shinjuku feel for travelers who want more comfort.",
      rating: 4.7,
      price: "$360/night",
      budgetTier: 3,
      district: "Shinjuku",
      tags: ["hotel", "luxury"],
      lat: 35.6895,
      lng: 139.6917,
    },
    {
      name: "Tokyo Metropolitan Observatory",
      category: "Viewpoint",
      desc: "Free skyline stop that gives you a clean first read on the city, especially around golden hour.",
      rating: 4.5,
      price: "Free",
      budgetTier: 1,
      district: "Shinjuku",
      tags: ["scenic", "view", "walk"],
      lat: 35.6896,
      lng: 139.6917,
    },
    {
      name: "Omoide Yokocho",
      category: "Dinner",
      desc: "Smoke-scented yakitori alley with tiny counters, fast pours, and the right amount of chaos for a first night.",
      rating: 4.6,
      price: "$18",
      budgetTier: 1,
      district: "Shinjuku",
      tags: ["food", "yakitori", "nightlife"],
      lat: 35.6944,
      lng: 139.6997,
    },
    {
      name: "Shinjuku Soba House",
      category: "Dinner",
      desc: "A lower-cost noodle stop that still feels distinctly local, fast, warm, and good after a long flight.",
      rating: 4.2,
      price: "$11",
      budgetTier: 1,
      district: "Shinjuku",
      tags: ["food", "budget"],
      lat: 35.6919,
      lng: 139.7026,
    },
    {
      name: "Golden Gai Cocktail Crawl",
      category: "Nightlife",
      desc: "A cluster of tiny bar rooms where one drink per stop is enough to turn the night into a memory.",
      rating: 4.5,
      price: "$24",
      budgetTier: 2,
      district: "Shinjuku",
      tags: ["nightlife", "bar", "late"],
      lat: 35.6941,
      lng: 139.7047,
    },
    {
      name: "Late-Night Matcha Lounge",
      category: "Cafe",
      desc: "A calmer evening alternative with desserts, tea flights, and a softer finish than a bar crawl.",
      rating: 4.3,
      price: "$16",
      budgetTier: 2,
      district: "Shinjuku",
      tags: ["nightlife", "coffee", "dessert", "quiet"],
      lat: 35.6924,
      lng: 139.7058,
    },
    {
      name: "Glitch Coffee Kanda",
      category: "Coffee",
      desc: "Single-origin pour-overs with nerdy precision, an easy morning win before diving into the anime district.",
      rating: 4.8,
      price: "$7",
      budgetTier: 2,
      district: "Kanda",
      tags: ["coffee", "design"],
      lat: 35.6956,
      lng: 139.7709,
    },
    {
      name: "Akihabara Electric Town",
      category: "Explore",
      desc: "Multi-floor game shops, retro hardware, anime merch, and enough visual noise to fill a full afternoon.",
      rating: 4.5,
      price: "Free",
      budgetTier: 1,
      district: "Akihabara",
      tags: ["anime", "shopping", "gaming"],
      lat: 35.6984,
      lng: 139.7731,
    },
    {
      name: "Kanda Gyoza Stand",
      category: "Lunch",
      desc: "Fast crisp-bottom dumplings and cold beer if you want it, close enough to keep the day route tight.",
      rating: 4.3,
      price: "$12",
      budgetTier: 1,
      district: "Akihabara",
      tags: ["food", "budget"],
      lat: 35.6971,
      lng: 139.7714,
    },
    {
      name: "Ueno Park Museum Walk",
      category: "Explore",
      desc: "Green breathing room plus museums and shrines, a useful reset after a denser shopping-heavy morning.",
      rating: 4.5,
      price: "Free",
      budgetTier: 1,
      district: "Ueno",
      tags: ["culture", "nature", "walk"],
      lat: 35.7156,
      lng: 139.773,
    },
    {
      name: "Senso-ji Temple",
      category: "Sightseeing",
      desc: "Tokyo's oldest temple and one of its best visual arrivals, especially if you approach through Nakamise.",
      rating: 4.7,
      price: "Free",
      budgetTier: 1,
      district: "Asakusa",
      tags: ["culture", "history", "temple"],
      lat: 35.7148,
      lng: 139.7967,
    },
    {
      name: "Kappabashi Kitchen Street",
      category: "Explore",
      desc: "A quirky stretch of knife shops, ceramics, and fake food displays that actually makes for great souvenir hunting.",
      rating: 4.4,
      price: "Free",
      budgetTier: 1,
      district: "Asakusa",
      tags: ["shopping", "walk", "design"],
      lat: 35.7141,
      lng: 139.7899,
    },
    {
      name: "teamLab Planets",
      category: "Experience",
      desc: "Immersive art rooms with mirrored light, shallow water, and a polished production value that plays great in a demo.",
      rating: 4.8,
      price: "$28",
      budgetTier: 2,
      district: "Toyosu",
      tags: ["art", "immersive", "family"],
      lat: 35.6465,
      lng: 139.793,
    },
    {
      name: "Toyosu Sushi Counter",
      category: "Dinner",
      desc: "Fish-market-adjacent omakase energy, best for travelers who specifically want the seafood flex.",
      rating: 4.7,
      price: "$65",
      budgetTier: 3,
      district: "Toyosu",
      tags: ["food", "sushi", "seafood"],
      lat: 35.6469,
      lng: 139.7847,
    },
    {
      name: "Toyosu Tempura House",
      category: "Dinner",
      desc: "Crisp seasonal tempura and rice sets, a safer pick when the group wants something classic without seafood pressure.",
      rating: 4.4,
      price: "$26",
      budgetTier: 2,
      district: "Toyosu",
      tags: ["food", "comfort"],
      lat: 35.6482,
      lng: 139.7868,
    },
    {
      name: "Koffee Mameya Omotesando",
      category: "Coffee",
      desc: "Minimalist coffee tasting counter with staff who explain the beans like a sommelier flight.",
      rating: 4.8,
      price: "$8",
      budgetTier: 2,
      district: "Harajuku",
      tags: ["coffee", "design"],
      lat: 35.6669,
      lng: 139.7103,
    },
    {
      name: "Meiji Jingu Forest Walk",
      category: "Sightseeing",
      desc: "A calm cedar-lined shrine approach that gives the day some air before dropping back into fashion and crowds.",
      rating: 4.7,
      price: "Free",
      budgetTier: 1,
      district: "Harajuku",
      tags: ["culture", "nature", "walk"],
      lat: 35.6764,
      lng: 139.6993,
    },
    {
      name: "Shibuya Gyoza Lounge",
      category: "Lunch",
      desc: "An easy lunch reset in the middle of the buzz, quick service and sharable plates.",
      rating: 4.2,
      price: "$14",
      budgetTier: 1,
      district: "Shibuya",
      tags: ["food", "budget"],
      lat: 35.6605,
      lng: 139.702,
    },
    {
      name: "Shibuya Sky",
      category: "Viewpoint",
      desc: "The cleanest big-city payoff in Tokyo, especially when you time it for late-afternoon light over the crossing.",
      rating: 4.8,
      price: "$21",
      budgetTier: 2,
      district: "Shibuya",
      tags: ["scenic", "view", "shopping"],
      lat: 35.6595,
      lng: 139.7005,
    },
    {
      name: "Tsukiji Outer Market",
      category: "Market",
      desc: "Snacks, skewers, knife shops, and low-friction breakfast grazing, useful when you want energy early.",
      rating: 4.5,
      price: "$22",
      budgetTier: 2,
      district: "Ginza",
      tags: ["food", "market", "seafood"],
      lat: 35.6655,
      lng: 139.7708,
    },
    {
      name: "Nezu Museum",
      category: "Museum",
      desc: "Compact, elegant, and paired with a great garden, one of the easier art stops to actually enjoy.",
      rating: 4.6,
      price: "$10",
      budgetTier: 2,
      district: "Aoyama",
      tags: ["art", "culture", "design"],
      lat: 35.6646,
      lng: 139.7245,
    },
    {
      name: "Daikanyama T-Site",
      category: "Explore",
      desc: "A design-forward bookstore complex with excellent browsing and one of the more relaxed neighborhood feels in the city.",
      rating: 4.6,
      price: "Free",
      budgetTier: 1,
      district: "Daikanyama",
      tags: ["shopping", "coffee", "design"],
      lat: 35.6481,
      lng: 139.7041,
    },
    {
      name: "Roppongi Hills Sky Deck",
      category: "Viewpoint",
      desc: "A dramatic last-night skyline stop, especially good when you want the city to feel a bit more cinematic.",
      rating: 4.7,
      price: "$18",
      budgetTier: 2,
      district: "Roppongi",
      tags: ["scenic", "nightlife", "view"],
      lat: 35.6605,
      lng: 139.7292,
    },
    {
      name: "Ginza Cocktail Atelier",
      category: "Nightlife",
      desc: "Polished bartenders, restrained lighting, and a cleaner luxury finish for the final evening.",
      rating: 4.6,
      price: "$28",
      budgetTier: 3,
      district: "Roppongi",
      tags: ["nightlife", "bar", "luxury"],
      lat: 35.6717,
      lng: 139.7659,
    },
  ],
};

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
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseDays(prompt) {
  const match = prompt.match(/(\d+)\s*(?:day|days|night|nights)/i);
  return clamp(match ? Number(match[1]) : 5, 2, 7, 5);
}

function parseTravelers(prompt) {
  const match = prompt.match(/(\d+)\s*(?:traveler|travelers|adult|adults|people|friends|guests)/i);
  return clamp(match ? Number(match[1]) : 2, 1, 12, 2);
}

function parseBudget(prompt) {
  const match = prompt.match(/\$\s?([\d,]+)/);
  if (match) return Number(match[1].replaceAll(",", ""));
  const plain = prompt.match(/budget\s*(?:of|under|around|is)?\s*([\d,]+)/i);
  if (plain) return Number(plain[1].replaceAll(",", ""));
  return 1800;
}

function detectPace(normalizedPrompt) {
  if (/(relaxed|slow|chill|easygoing|laid back)/.test(normalizedPrompt)) return "Relaxed";
  if (/(fast|packed|ambitious|busy|maximize)/.test(normalizedPrompt)) return "Fast-paced";
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
  for (const [interest, words] of Object.entries(INTEREST_KEYWORDS)) {
    if (words.some((word) => normalizedPrompt.includes(word))) interests.add(interest);
  }
  if (!interests.size) {
    interests.add("coffee");
    interests.add("food");
    interests.add("culture");
    interests.add("scenic");
  }
  return [...interests];
}

function findKnownCity(prompt) {
  const normalized = prompt.toLowerCase();
  const keys = Object.keys(CITY_CENTERS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (normalized.includes(key)) {
      return key;
    }
  }
  return null;
}

function extractDestination(prompt) {
  const known = findKnownCity(prompt);
  if (known) return CITY_CENTERS[known].displayName;

  const matchers = [
    /(?:trip|itinerary|travel)\s+(?:to|for|in)\s+([A-Za-z][A-Za-z\s'-]+)/i,
    /(?:to|in|for|visiting)\s+([A-Za-z][A-Za-z\s'-]+)/i,
  ];

  for (const matcher of matchers) {
    const match = prompt.match(matcher);
    if (match?.[1]) {
      const cleaned = match[1].split(/(?:with|under|budget|for|and|,|\.)/i)[0].trim();
      if (cleaned) return titleCase(cleaned);
    }
  }

  return "Tokyo";
}

function getBudgetBand(amount) {
  if (amount <= 1400) return 1;
  if (amount >= 3200) return 3;
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
    return {
      label: "Book stay",
      href: buildSearchLink(`${place.name} ${destination} booking`),
    };
  }

  if (["Dinner", "Lunch", "Nightlife"].includes(place.category)) {
    return {
      label: "Reserve",
      href: buildSearchLink(`${place.name} ${destination} reservation`),
    };
  }

  if (["Experience", "Viewpoint", "Museum", "Sightseeing"].includes(place.category)) {
    return {
      label: "Get tickets",
      href: buildSearchLink(`${place.name} ${destination} tickets`),
    };
  }

  return {
    label: "View details",
    href: buildSearchLink(`${place.name} ${destination}`),
  };
}

function enrichPlace(place, destination) {
  const primaryLink = buildPrimaryLink(place, destination);
  return {
    ...place,
    id: slugify(`${destination}-${place.name}`),
    tag: place.category,
    stars: Math.max(1, Math.min(5, Math.round(place.rating))),
    img: place.img ?? `https://picsum.photos/seed/${slugify(`${destination}-${place.name}`)}/360/240`,
    mapsUrl: buildMapsLink(place.name, destination),
    primaryLink,
  };
}

function placeBlocked(place, exclusions) {
  const tags = new Set(place.tags ?? []);
  if (exclusions.noSeafood && tags.has("seafood")) return true;
  if (exclusions.noAlcohol && tags.has("bar")) return true;
  if (exclusions.vegetarian && (tags.has("yakitori") || tags.has("seafood"))) return true;
  return false;
}

function scorePlace(place, slot, request) {
  if (placeBlocked(place, request.exclusions)) return -10_000;

  let score = 0;
  if (slot.category && place.category === slot.category) score += 25;
  if (slot.district && place.district === slot.district) score += 16;
  for (const tag of slot.tags ?? []) {
    if ((place.tags ?? []).includes(tag)) score += 9;
  }
  for (const interest of request.interests) {
    if ((place.tags ?? []).includes(interest)) score += 4;
  }

  const budgetGap = Math.abs((place.budgetTier ?? 2) - request.budgetBand);
  score -= budgetGap * 4;

  if (request.pace === "Relaxed" && (place.tags ?? []).includes("walk")) score += 3;
  if (request.pace === "Fast-paced" && ["shopping", "anime", "market"].some((tag) => (place.tags ?? []).includes(tag))) score += 2;

  return score + place.rating;
}

function fallbackPlace(slot, request, dayNumber, itemNumber, origin) {
  const center = origin ?? CITY_CENTERS.tokyo;
  const nameMap = {
    Hotel: `${request.destination} Central Stay`,
    Coffee: `${request.destination} Roastery Lab`,
    Lunch: `${request.destination} Market Lunch`,
    Dinner: `${request.destination} Signature Dinner`,
  };

  const tag = slot.category || (slot.tags?.includes("scenic") ? "Viewpoint" : "Explore");
  const name = nameMap[slot.category] || `${request.destination} ${tag} Stop ${dayNumber}-${itemNumber}`;
  const lat = center.lat + 0.012 * dayNumber - 0.004 * itemNumber;
  const lng = center.lng + 0.01 * itemNumber - 0.003 * dayNumber;
  const desc = `A generated ${tag.toLowerCase()} stop in ${request.destination}, placed to keep the route coherent for this demo itinerary.`;

  return enrichPlace(
    {
      name,
      category: slot.category || tag,
      desc,
      rating: 4.3,
      price: slot.category === "Hotel" ? "$160/night" : slot.category === "Dinner" ? "$28" : slot.category === "Lunch" ? "$16" : "Free",
      budgetTier: request.budgetBand,
      district: request.destination,
      tags: slot.tags ?? ["demo"],
      lat,
      lng,
    },
    request.destination,
  );
}

function buildTokyoItinerary(request) {
  const used = new Set();
  const days = [];

  const plans = TOKYO_PROFILE.dayPlans.slice(0, request.days);

  for (const [dayIndex, plan] of plans.entries()) {
    const items = plan.slots.map((slot, itemIndex) => {
      const ranked = TOKYO_PROFILE.places
        .filter((place) => !used.has(place.name))
        .map((place) => ({ place, score: scorePlace(place, slot, request) }))
        .sort((a, b) => b.score - a.score);

      const selected = ranked[0]?.score > -9999 ? ranked[0].place : null;
      const place = selected ? enrichPlace(selected, request.destination) : fallbackPlace(slot, request, dayIndex + 1, itemIndex + 1, TOKYO_PROFILE.center);
      used.add(place.name);

      return {
        ...place,
        day: dayIndex + 1,
        dayName: plan.dayName,
        time: slot.time,
      };
    });

    days.push({
      day: dayIndex + 1,
      dayName: plan.dayName,
      items,
    });
  }

  while (days.length < request.days) {
    const nextDay = days.length + 1;
    const items = [
      fallbackPlace({ category: "Coffee", tags: ["coffee"] }, request, nextDay, 1, TOKYO_PROFILE.center),
      fallbackPlace({ tags: ["culture", "walk"] }, request, nextDay, 2, TOKYO_PROFILE.center),
      fallbackPlace({ category: "Lunch", tags: ["food"] }, request, nextDay, 3, TOKYO_PROFILE.center),
      fallbackPlace({ category: "Dinner", tags: ["food", "scenic"] }, request, nextDay, 4, TOKYO_PROFILE.center),
    ].map((item, itemIndex) => ({
      ...item,
      day: nextDay,
      dayName: `Flexible Day ${nextDay}`,
      time: ["9:00 AM", "11:30 AM", "1:30 PM", "6:30 PM"][itemIndex],
    }));

    days.push({ day: nextDay, dayName: `Flexible Day ${nextDay}`, items });
  }

  return finalizeTrip(request, TOKYO_PROFILE.center, days);
}

function generateGenericPlaces(request, origin) {
  const interests = request.interests;
  const dayThemes = [
    "Arrival & Orientation",
    "Local Flavor & Neighborhoods",
    "Culture & Signature Stops",
    "Slow Afternoon & Skyline",
    "Best Hits Finale",
    "Extra Flex Day",
    "Departure Buffer",
  ];

  const dayTemplates = [
    [
      { time: "2:30 PM", category: "Hotel", kind: "stay" },
      { time: "5:00 PM", kind: "walk" },
      { time: "7:15 PM", category: "Dinner", kind: "food" },
      { time: "9:00 PM", kind: "night" },
    ],
    [
      { time: "9:00 AM", category: "Coffee", kind: "coffee" },
      { time: "11:00 AM", kind: interests.includes("culture") ? "culture" : "explore" },
      { time: "1:00 PM", category: "Lunch", kind: "food" },
      { time: "4:00 PM", kind: interests.includes("shopping") ? "shopping" : "scenic" },
    ],
    [
      { time: "9:15 AM", category: "Coffee", kind: interests.includes("coffee") ? "coffee" : "walk" },
      { time: "11:30 AM", kind: interests.includes("art") ? "art" : "culture" },
      { time: "2:00 PM", kind: interests.includes("nature") ? "nature" : "explore" },
      { time: "6:30 PM", category: "Dinner", kind: interests.includes("nightlife") ? "night" : "food" },
    ],
  ];

  const placeNames = {
    stay: ["Central Stay", "Boutique Base", "Transit-Friendly Hotel"],
    walk: ["Old Town Walk", "Canal Side Stroll", "Civic Promenade"],
    food: ["Chef's Counter", "Market Hall", "Neighborhood Table"],
    night: ["Night Lights Lounge", "Rooftop Evening", "After-Hours Arcade"],
    coffee: ["Roastery Lab", "Minimalist Coffee Bar", "Morning Brew House"],
    culture: ["Heritage Quarter", "City Museum Stop", "Landmark Square"],
    explore: ["Creative District", "Local Design Streets", "Signature Neighborhood"],
    scenic: ["Skyline Deck", "Hilltop Lookout", "Riverfront Viewpoint"],
    shopping: ["Independent Shops Run", "Vintage Strip", "Design Market"],
    art: ["Immersive Gallery", "Modern Art Hall", "Sculpture Garden"],
    nature: ["Garden Walk", "Urban Park Loop", "Botanical Pause"],
  };

  const priceMap = {
    Hotel: "$170/night",
    Coffee: "$7",
    Lunch: "$18",
    Dinner: "$34",
  };

  const categoryMap = {
    stay: "Hotel",
    walk: "Explore",
    food: "Experience",
    night: "Nightlife",
    coffee: "Coffee",
    culture: "Sightseeing",
    explore: "Explore",
    scenic: "Viewpoint",
    shopping: "Explore",
    art: "Experience",
    nature: "Sightseeing",
  };

  const descMap = {
    stay: "A centrally placed stay that keeps the first and last mile friction low for the itinerary.",
    walk: `A relaxed route through one of ${request.destination}'s more photogenic pockets.`,
    food: `A generated stop meant to reflect the strongest local food energy in ${request.destination}.`,
    night: "A night-cap stop that gives the route a clear evening landing point.",
    coffee: "A strong morning coffee anchor before the day fans out.",
    culture: `A signature culture stop to make the trip feel place-specific instead of generic.`,
    explore: `A flexible exploration block tuned around your interests in ${request.destination}.`,
    scenic: "A viewpoint or skyline payoff chosen to give the route a visual highlight.",
    shopping: "A browse-heavy pocket with enough density to feel rewarding without over-planning.",
    art: "An immersive or design-led stop that adds contrast to the itinerary.",
    nature: "A greener, slower section to keep the pacing breathable.",
  };

  const items = [];

  for (let day = 1; day <= request.days; day += 1) {
    const slots = dayTemplates[(day - 1) % dayTemplates.length];
    const dayName = dayThemes[(day - 1) % dayThemes.length];
    const dayItems = slots.map((slot, index) => {
      const candidates = placeNames[slot.kind] || ["Signature Stop"];
      const name = `${request.destination} ${candidates[index % candidates.length]}`;
      const lat = origin.lat + 0.01 * day - 0.005 * index;
      const lng = origin.lng + 0.007 * index - 0.004 * day;
      const baseCategory = slot.category || categoryMap[slot.kind] || "Explore";
      const place = enrichPlace(
        {
          name,
          category: baseCategory,
          desc: descMap[slot.kind] || `A generated stop in ${request.destination}.`,
          rating: 4.2 + ((day + index) % 4) * 0.15,
          price: priceMap[baseCategory] || (baseCategory === "Viewpoint" ? "$16" : "Free"),
          budgetTier: request.budgetBand,
          district: request.destination,
          tags: [slot.kind, ...request.interests.slice(0, 2)],
          lat,
          lng,
        },
        request.destination,
      );

      return {
        ...place,
        day,
        dayName,
        time: slot.time,
      };
    });

    items.push({ day, dayName, items: dayItems });
  }

  return items;
}

function finalizeTrip(request, origin, days) {
  const flatPlaces = days.flatMap((day) => day.items);
  const interestLine = request.interests.slice(0, 3).join(", ");
  const travelerLabel = `${request.travelers} ${request.travelers === 1 ? "adult" : "adults"}`;
  const excludedBits = [];
  if (request.exclusions.noSeafood) excludedBits.push("seafood removed");
  if (request.exclusions.noAlcohol) excludedBits.push("no nightlife pressure");
  if (request.exclusions.vegetarian) excludedBits.push("vegetarian-friendly swaps");

  return {
    request,
    title: `${request.days} Days in ${request.destination}`,
    subtitle: `A ${request.pace.toLowerCase()} itinerary built around ${interestLine || "smart city highlights"}${excludedBits.length ? `, with ${excludedBits.join(" and ")}` : ""}.`,
    badge: `Full itinerary · ${request.destination}`,
    destination: request.destination,
    departure: origin.departure || "TBD",
    budgetLabel: `$${request.budget.toLocaleString()} total`,
    paceLabel: request.pace,
    travelerLabel,
    summary: `${flatPlaces.length} mapped stops, connected in sequence with booking and details links.`,
    followUpSuggestions: [
      `Make this cheaper in ${request.destination}`,
      `Add one luxury dinner in ${request.destination}`,
      `Shift this toward nightlife`,
      `Swap seafood out completely`,
    ],
    route: flatPlaces.map((place) => ({ id: place.id, lat: place.lat, lng: place.lng, day: place.day })),
    days,
  };
}

export function generateItinerary(rawPrompt = "") {
  const prompt = rawPrompt.trim() || "Plan a relaxed 5 day Tokyo trip for 2 adults with coffee, anime, sushi, and culture";
  const normalizedPrompt = prompt.toLowerCase();
  const destination = extractDestination(prompt);
  const budget = parseBudget(prompt);
  const request = {
    prompt,
    destination,
    days: parseDays(prompt),
    travelers: parseTravelers(prompt),
    budget,
    budgetBand: getBudgetBand(budget),
    pace: detectPace(normalizedPrompt),
    interests: detectInterests(normalizedPrompt),
    exclusions: detectExclusions(normalizedPrompt),
  };

  const knownKey = findKnownCity(destination);
  if (knownKey === "tokyo") {
    return { trip: buildTokyoItinerary(request) };
  }

  const origin = CITY_CENTERS[knownKey] || { ...CITY_CENTERS.tokyo, displayName: destination };
  const days = generateGenericPlaces(request, origin);
  return {
    trip: finalizeTrip(request, origin, days),
  };
}

export { escapeHtml };
