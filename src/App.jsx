import { useState, useEffect, useRef } from "react";

const PLACES = [
  { day: 1, dayName: "Arrival & Shinjuku", time: "2:40 PM", name: "Hotel Check-in, Shinjuku", desc: "Drop bags at a mid-range tower hotel a five-minute walk from the station — good base for late-night ramen runs.", tag: "Hotel", stars: 4, rating: "4.3", price: "—", lat: 35.6938, lng: 139.7034, img: "https://picsum.photos/seed/shinjuku-hotel/240/240" },
  { day: 1, dayName: "Arrival & Shinjuku", time: "6:00 PM", name: "Omoide Yokocho", desc: "Narrow smoke-scented alley of tiny yakitori counters — order a few skewers at two or three different stalls.", tag: "Dinner", stars: 5, rating: "4.6", price: "$18", lat: 35.6944, lng: 139.6997, img: "https://picsum.photos/seed/omoide-yokocho/240/240" },
  { day: 2, dayName: "Akihabara & Coffee", time: "9:30 AM", name: "Onibus Coffee, Nakameguro", desc: "Small-batch roaster along the canal, standing-room only. Their single-origin filter is worth the short line.", tag: "Coffee", stars: 5, rating: "4.7", price: "$5", lat: 35.6440, lng: 139.6989, img: "https://picsum.photos/seed/onibus-coffee/240/240" },
  { day: 2, dayName: "Akihabara & Coffee", time: "11:15 AM", name: "Akihabara Electric Town", desc: "Multi-floor arcades, retro game shops, and figure stores stacked on top of each other — easy to lose two hours here.", tag: "Explore", stars: 4, rating: "4.4", price: "Free", lat: 35.6984, lng: 139.7731, img: "https://picsum.photos/seed/akihabara-town/240/240" },
  { day: 2, dayName: "Akihabara & Coffee", time: "1:00 PM", name: "Harajuku Gyozarou", desc: "Cheap, fast, unbeatable pan-fried gyoza — expect a short queue but tables turn over quickly.", tag: "Lunch", stars: 4, rating: "4.2", price: "$10", lat: 35.6702, lng: 139.7016, img: "https://picsum.photos/seed/gyozarou/240/240" },
  { day: 2, dayName: "Akihabara & Coffee", time: "6:30 PM", name: "Sushi Dai-style Counter, Toyosu", desc: "Omakase counter near the new fish market — go early, it's first-come and worth the wait for the tuna course.", tag: "Dinner", stars: 5, rating: "4.8", price: "$65", lat: 35.6428, lng: 139.7717, img: "https://picsum.photos/seed/sushi-toyosu/240/240" },
  { day: 3, dayName: "Asakusa & Culture", time: "9:45 AM", name: "Senso-ji Temple", desc: "Tokyo's oldest temple — walk the Nakamise shopping street on the approach for snacks and souvenirs.", tag: "Sightseeing", stars: 5, rating: "4.7", price: "Free", lat: 35.7148, lng: 139.7967, img: "https://picsum.photos/seed/sensoji/240/240" },
  { day: 3, dayName: "Asakusa & Culture", time: "1:30 PM", name: "teamLab Planets", desc: "Immersive light-and-water art installation — wear shorts, you'll be wading. Book the timed entry in advance.", tag: "Experience", stars: 5, rating: "4.9", price: "$28", lat: 35.6465, lng: 139.7930, img: "https://picsum.photos/seed/teamlab/240/240" },
];

const CSS = `
  .travelos-root{
    --paper:#F6F4EE; --paper-2:#EFEBE1; --ink:#1E1C19; --ink-soft:#6B655C;
    --aizome:#2C4468; --aizome-deep:#1B2C42; --torii:#C1442A; --moss:#5C6E4E;
    --line:#DCD5C6; --card:#FFFFFF;
    font-family:'Work Sans', sans-serif; color:var(--ink); background:var(--paper);
    height:100vh; width:100%; overflow:hidden; box-sizing:border-box;
  }
  .travelos-root *{ box-sizing:border-box; }
  .to-app{ display:flex; height:100%; width:100%; }
  .to-left{ width:50%; height:100%; position:relative; display:flex; flex-direction:column; border-right:1px solid var(--line); }
  .to-scroll{ overflow-y:auto; height:100%; padding:36px 40px 160px 40px; scrollbar-width:thin; scrollbar-color:var(--line) transparent; }
  .to-scroll::-webkit-scrollbar{ width:8px; }
  .to-scroll::-webkit-scrollbar-thumb{ background:var(--line); border-radius:8px; }
  .to-eyebrow{ font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--torii); display:flex; align-items:center; gap:8px; margin-bottom:14px; }
  .to-eyebrow::before{ content:""; width:6px; height:6px; border-radius:50%; background:var(--torii); display:inline-block; }
  .to-title{ font-family:'Fraunces', serif; font-weight:500; font-size:44px; line-height:1.05; letter-spacing:-.01em; color:var(--aizome-deep); margin-bottom:10px; }
  .to-subtitle{ font-size:16px; color:var(--ink-soft); max-width:520px; line-height:1.55; margin-bottom:26px; }
  .to-trip-meta{ display:flex; gap:22px; flex-wrap:wrap; padding:16px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); margin-bottom:34px; }
  .to-meta-item .to-label{ font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:4px; }
  .to-meta-item .to-value{ font-size:15px; font-weight:500; }
  .to-day-block{ margin-bottom:44px; }
  .to-day-head{ display:flex; align-items:baseline; gap:12px; margin-bottom:20px; }
  .to-day-head .to-num{ font-family:'Fraunces', serif; font-size:26px; color:var(--torii); }
  .to-day-head .to-name{ font-family:'Fraunces', serif; font-size:22px; color:var(--aizome-deep); }
  .to-day-head .to-rule{ flex:1; height:1px; background:var(--line); }
  .to-place-card{ display:flex; background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:16px; cursor:pointer; transition:box-shadow .18s ease, transform .18s ease, border-color .18s ease; position:relative; }
  .to-place-card:hover{ box-shadow:0 10px 26px -14px rgba(28,44,66,.35); transform:translateY(-2px); border-color:var(--aizome); }
  .to-place-card.active{ border-color:var(--torii); box-shadow:0 0 0 2px rgba(193,68,42,.15); }
  .to-place-time{ width:78px; flex-shrink:0; background:var(--paper-2); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-size:13px; color:var(--aizome-deep); border-right:1px dashed var(--line); position:relative; }
  .to-place-time::before,.to-place-time::after{ content:""; position:absolute; width:12px; height:12px; background:var(--paper); border-radius:50%; right:-6px; }
  .to-place-time::before{ top:-6px; }
  .to-place-time::after{ bottom:-6px; }
  .to-place-img{ width:112px; flex-shrink:0; background-size:cover; background-position:center; }
  .to-place-body{ padding:14px 18px; flex:1; min-width:0; }
  .to-place-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .to-place-name{ font-family:'Fraunces', serif; font-size:17px; font-weight:500; color:var(--ink); }
  .to-place-tag{ font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--moss); background:rgba(92,110,78,.1); padding:3px 7px; border-radius:5px; white-space:nowrap; }
  .to-place-desc{ font-size:13.5px; color:var(--ink-soft); line-height:1.5; margin:6px 0 10px 0; }
  .to-place-foot{ display:flex; align-items:center; gap:14px; font-size:12.5px; }
  .to-stars{ color:var(--torii); letter-spacing:1px; }
  .to-rating-num{ color:var(--ink-soft); }
  .to-price{ margin-left:auto; font-family:'JetBrains Mono', monospace; color:var(--aizome-deep); font-weight:500; }
  .to-right{ width:50%; height:100%; position:relative; }
  .to-map{ width:100%; height:100%; }
  .to-map-badge{ position:absolute; top:20px; left:20px; z-index:500; background:rgba(246,244,238,.85); backdrop-filter:blur(10px); border:1px solid var(--line); border-radius:10px; padding:8px 14px; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--aizome-deep); box-shadow:0 6px 18px -10px rgba(28,44,66,.3); }
  .to-composer{ position:absolute; left:24px; right:24px; bottom:20px; z-index:900; background:rgba(255,255,255,.62); backdrop-filter:blur(22px) saturate(160%); -webkit-backdrop-filter:blur(22px) saturate(160%); border:1px solid rgba(255,255,255,.8); border-radius:18px; box-shadow:0 20px 45px -18px rgba(28,44,66,.35); padding:12px 14px; }
  .to-chips{ display:flex; gap:8px; margin-bottom:10px; overflow-x:auto; }
  .to-chip{ font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--aizome-deep); background:rgba(44,68,104,.08); border:1px solid rgba(44,68,104,.15); padding:6px 11px; border-radius:20px; white-space:nowrap; cursor:pointer; transition:background .15s ease; }
  .to-chip:hover{ background:rgba(44,68,104,.16); }
  .to-input-row{ display:flex; align-items:center; gap:10px; }
  .to-input-row input{ flex:1; border:none; background:transparent; outline:none; font-family:'Work Sans', sans-serif; font-size:14.5px; color:var(--ink); padding:8px 4px; }
  .to-input-row input::placeholder{ color:var(--ink-soft); }
  .to-send-btn{ background:var(--aizome-deep); color:#fff; border:none; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background .15s ease, transform .1s ease; }
  .to-send-btn:hover{ background:var(--torii); }
  .to-send-btn:active{ transform:scale(.94); }
  .to-tile-warning{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; text-align:center; padding:40px; font-family:sans-serif; color:#6B655C; background:#F6F4EE; z-index:400; }
  @media (max-width: 860px){ .to-app{ flex-direction:column; } .to-left,.to-right{ width:100%; height:50%; } }
`;

export default function TravelOS() {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [leafletReady, setLeafletReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [activePlace, setActivePlace] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [placeholder, setPlaceholder] = useState("Ask to adjust the plan — budget, pace, restaurants, anything…");

  // Load fonts + Leaflet from CDN
  useEffect(() => {
    if (!document.getElementById("to-fonts")) {
      const link = document.createElement("link");
      link.id = "to-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }

    if (window.L) {
      setLeafletReady(true);
      return;
    }

    if (!document.getElementById("to-leaflet-css")) {
      const css = document.createElement("link");
      css.id = "to-leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(css);
    }

    const existingScript = document.getElementById("to-leaflet-js");
    if (existingScript) {
      existingScript.addEventListener("load", () => setLeafletReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "to-leaflet-js";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLeafletReady(true);
    document.body.appendChild(script);
  }, []);

  // Initialize map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapRef.current) return;
    const L = window.L;

    const map = L.map(mapDivRef.current, { zoomControl: false }).setView([35.6820, 139.7595], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    tileLayer.on("tileerror", () => setTileError(true));

    const markerIcon = (active) =>
      L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${active ? "#C1442A" : "#2C4468"};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 16],
      });

    PLACES.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: markerIcon(false) }).addTo(map);
      m.bindPopup(`<b>${p.name}</b><br>${p.time} · ${p.tag}`);
      markersRef.current[p.name] = m;
    });

    mapRef.current = { map, markerIcon };
  }, [leafletReady]);

  const focusPlace = (p) => {
    setActivePlace(p.name);
    const { map, markerIcon } = mapRef.current || {};
    if (!map) return;
    Object.entries(markersRef.current).forEach(([name, m]) => {
      m.setIcon(markerIcon(name === p.name));
    });
    map.flyTo([p.lat, p.lng], 15, { duration: 0.8 });
    markersRef.current[p.name].openPopup();
  };

  const quickFill = (text) => setInputValue(text);

  const sendMsg = () => {
    if (inputValue.trim().length) {
      setPlaceholder("Updating your itinerary…");
      setInputValue("");
    }
  };

  const dayGroups = PLACES.reduce((acc, p) => {
    (acc[p.day] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="travelos-root">
      <style>{CSS}</style>
      <div className="to-app">
        <div className="to-left">
          <div className="to-scroll">
            <div className="to-eyebrow">Trip plan · Auto-updating</div>
            <h1 className="to-title">5 Days in Tokyo</h1>
            <p className="to-subtitle">
              A relaxed itinerary built around anime culture, specialty coffee, and sushi — nothing before 9&nbsp;AM. Tap any stop to see it on the map.
            </p>

            <div className="to-trip-meta">
              <div className="to-meta-item"><div className="to-label">Depart</div><div className="to-value">SFO → HND, Jul 24</div></div>
              <div className="to-meta-item"><div className="to-label">Budget</div><div className="to-value">$1,800 total</div></div>
              <div className="to-meta-item"><div className="to-label">Pace</div><div className="to-value">Relaxed</div></div>
              <div className="to-meta-item"><div className="to-label">Travelers</div><div className="to-value">2 adults</div></div>
            </div>

            {Object.keys(dayGroups).sort().map((dayNum) => {
              const group = dayGroups[dayNum];
              return (
                <div className="to-day-block" key={dayNum}>
                  <div className="to-day-head">
                    <div className="to-num">{String(dayNum).padStart(2, "0")}</div>
                    <div className="to-name">{group[0].dayName}</div>
                    <div className="to-rule"></div>
                  </div>

                  {group.map((p) => (
                    <div
                      key={p.name}
                      className={`to-place-card${activePlace === p.name ? " active" : ""}`}
                      onClick={() => focusPlace(p)}
                    >
                      <div className="to-place-time">{p.time}</div>
                      <div className="to-place-img" style={{ backgroundImage: `url('${p.img}')` }}></div>
                      <div className="to-place-body">
                        <div className="to-place-top">
                          <div className="to-place-name">{p.name}</div>
                          <div className="to-place-tag">{p.tag}</div>
                        </div>
                        <div className="to-place-desc">{p.desc}</div>
                        <div className="to-place-foot">
                          <span className="to-stars">{"★".repeat(p.stars)}{"☆".repeat(5 - p.stars)}</span>
                          <span className="to-rating-num">{p.rating}</span>
                          <span className="to-price">{p.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="to-composer">
            <div className="to-chips">
              <div className="to-chip" onClick={() => quickFill("Lower my budget to $1200")}>Lower budget to $1,200</div>
              <div className="to-chip" onClick={() => quickFill("Add a day trip to Kyoto")}>Add a Kyoto day</div>
              <div className="to-chip" onClick={() => quickFill("I don't like seafood")}>I don't like seafood</div>
              <div className="to-chip" onClick={() => quickFill("Find a cheaper hotel")}>Find a cheaper hotel</div>
            </div>
            <div className="to-input-row">
              <input
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              />
              <button className="to-send-btn" onClick={sendMsg}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12L20 4L13 20L11 13L4 12Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="to-right">
          <div className="to-map-badge">Day 2 · walking route</div>
          <div className="to-map" ref={mapDivRef}></div>
          {tileError && (
            <div className="to-tile-warning">
              Map tiles failed to load.<br />
              This usually means an ad blocker or network filter is blocking tile.openstreetmap.org — try disabling it for this page, or check your network settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}