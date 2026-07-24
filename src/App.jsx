import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PROMPT = "Plan a relaxed 5 day Tokyo trip for 2 adults with coffee, anime, sushi, and culture";
const DEFAULT_CHIPS = [
  "Lower my budget to $1200",
  "Add more nightlife",
  "I don't like seafood",
  "Make this more romantic",
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
  .to-title{ font-family:'Fraunces', serif; font-weight:500; font-size:44px; line-height:1.05; letter-spacing:-.01em; color:var(--aizome-deep); margin:0 0 10px 0; }
  .to-subtitle{ font-size:16px; color:var(--ink-soft); max-width:520px; line-height:1.55; margin:0 0 16px 0; }
  .to-status{ font-size:13px; color:var(--aizome-deep); margin-bottom:26px; }
  .to-status strong{ color:var(--torii); }
  .to-error{ margin-top:8px; color:var(--torii); }
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
  .to-place-time{ width:78px; flex-shrink:0; background:var(--paper-2); display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-size:13px; color:var(--aizome-deep); border-right:1px dashed var(--line); position:relative; text-align:center; padding:0 8px; }
  .to-place-time::before,.to-place-time::after{ content:""; position:absolute; width:12px; height:12px; background:var(--paper); border-radius:50%; right:-6px; }
  .to-place-time::before{ top:-6px; }
  .to-place-time::after{ bottom:-6px; }
  .to-place-img{ width:112px; flex-shrink:0; background-size:cover; background-position:center; }
  .to-place-body{ padding:14px 18px; flex:1; min-width:0; }
  .to-place-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .to-place-name{ font-family:'Fraunces', serif; font-size:17px; font-weight:500; color:var(--ink); }
  .to-place-tag{ font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--moss); background:rgba(92,110,78,.1); padding:3px 7px; border-radius:5px; white-space:nowrap; }
  .to-place-desc{ font-size:13.5px; color:var(--ink-soft); line-height:1.5; margin:6px 0 10px 0; }
  .to-place-foot{ display:flex; align-items:center; gap:14px; font-size:12.5px; flex-wrap:wrap; }
  .to-stars{ color:var(--torii); letter-spacing:1px; }
  .to-rating-num{ color:var(--ink-soft); }
  .to-place-actions{ margin-left:auto; display:flex; align-items:center; gap:10px; }
  .to-price{ font-family:'JetBrains Mono', monospace; color:var(--aizome-deep); font-weight:500; }
  .to-place-link{ text-decoration:none; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:var(--aizome-deep); border:1px solid rgba(44,68,104,.18); border-radius:999px; padding:6px 9px; transition:background .15s ease, color .15s ease, border-color .15s ease; }
  .to-place-link:hover{ background:var(--aizome-deep); color:#fff; border-color:var(--aizome-deep); }
  .to-right{ width:50%; height:100%; position:relative; }
  .to-map{ width:100%; height:100%; }
  .to-map-badge{ position:absolute; top:20px; left:20px; z-index:500; background:rgba(246,244,238,.85); backdrop-filter:blur(10px); border:1px solid var(--line); border-radius:10px; padding:8px 14px; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--aizome-deep); box-shadow:0 6px 18px -10px rgba(28,44,66,.3); }
  .to-composer{ position:absolute; left:24px; right:24px; bottom:20px; z-index:900; background:rgba(255,255,255,.62); backdrop-filter:blur(22px) saturate(160%); -webkit-backdrop-filter:blur(22px) saturate(160%); border:1px solid rgba(255,255,255,.8); border-radius:18px; box-shadow:0 20px 45px -18px rgba(28,44,66,.35); padding:12px 14px; }
  .to-chips{ display:flex; gap:8px; margin-bottom:10px; overflow-x:auto; }
  .to-chip{ font-family:'JetBrains Mono', monospace; font-size:11px; color:var(--aizome-deep); background:rgba(44,68,104,.08); border:1px solid rgba(44,68,104,.15); padding:6px 11px; border-radius:20px; white-space:nowrap; cursor:pointer; transition:background .15s ease, border-color .15s ease; }
  .to-chip:hover{ background:rgba(44,68,104,.16); border-color:rgba(44,68,104,.32); }
  .to-input-row{ display:flex; align-items:center; gap:10px; }
  .to-input-row input{ flex:1; border:none; background:transparent; outline:none; font-family:'Work Sans', sans-serif; font-size:14.5px; color:var(--ink); padding:8px 4px; }
  .to-input-row input::placeholder{ color:var(--ink-soft); }
  .to-send-btn{ background:var(--aizome-deep); color:#fff; border:none; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background .15s ease, transform .1s ease, opacity .15s ease; }
  .to-send-btn:hover{ background:var(--torii); }
  .to-send-btn:active{ transform:scale(.94); }
  .to-send-btn:disabled{ cursor:wait; opacity:.72; }
  .to-tile-warning{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; text-align:center; padding:40px; font-family:sans-serif; color:#6B655C; background:#F6F4EE; z-index:400; }
  .to-loading{ display:inline-flex; align-items:center; gap:8px; color:var(--torii); }
  .to-loading::before{ content:""; width:10px; height:10px; border-radius:50%; background:var(--torii); animation:to-pulse 1s ease-in-out infinite; }
  @keyframes to-pulse{ 0%,100%{ transform:scale(.8); opacity:.55; } 50%{ transform:scale(1); opacity:1; } }
  .to-popup-card{ width:230px; }
  .to-popup-img{ width:100%; height:110px; object-fit:cover; border-radius:10px; margin-bottom:10px; }
  .to-popup-kicker{ font-family:'JetBrains Mono', monospace; font-size:10px; color:var(--moss); text-transform:uppercase; letter-spacing:.07em; margin-bottom:4px; }
  .to-popup-name{ font-family:'Fraunces', serif; font-size:18px; color:var(--aizome-deep); margin-bottom:6px; }
  .to-popup-copy{ font-size:13px; line-height:1.45; color:var(--ink-soft); margin-bottom:10px; }
  .to-popup-meta{ font-size:12px; color:var(--ink); margin-bottom:10px; }
  .to-popup-actions{ display:flex; gap:8px; flex-wrap:wrap; }
  .to-popup-actions a{ text-decoration:none; font-family:'JetBrains Mono', monospace; font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--aizome-deep); border:1px solid rgba(44,68,104,.16); border-radius:999px; padding:7px 10px; }
  .to-popup-actions a:hover{ background:var(--aizome-deep); color:#fff; }
  .leaflet-popup-content-wrapper{ border-radius:14px; }
  .leaflet-popup-content{ margin:12px; }
  @media (max-width: 860px){ .to-app{ flex-direction:column; } .to-left,.to-right{ width:100%; height:50%; } .to-scroll{ padding:28px 20px 160px 20px; } .to-title{ font-size:36px; } }
`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPopupHtml(place) {
  return `
    <div class="to-popup-card">
      <img class="to-popup-img" src="${escapeHtml(place.img)}" alt="${escapeHtml(place.name)}" />
      <div class="to-popup-kicker">${escapeHtml(place.tag)}</div>
      <div class="to-popup-name">${escapeHtml(place.name)}</div>
      <div class="to-popup-copy">${escapeHtml(place.desc)}</div>
      <div class="to-popup-meta">${escapeHtml(place.time)} · ★ ${escapeHtml(place.rating)} · ${escapeHtml(place.price)}</div>
      <div class="to-popup-actions">
        <a href="${escapeHtml(place.primaryLink.href)}" target="_blank" rel="noreferrer">${escapeHtml(place.primaryLink.label)}</a>
        <a href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noreferrer">Directions</a>
      </div>
    </div>
  `;
}

export default function TravelOS() {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routeRef = useRef(null);
  const activePlaceIdRef = useRef("");

  const [leafletReady, setLeafletReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [trip, setTrip] = useState(null);
  const [activePlaceId, setActivePlaceId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusLine, setStatusLine] = useState("Generating itinerary pipeline...");

  const flatPlaces = useMemo(() => trip?.days?.flatMap((day) => day.items) ?? [], [trip]);
  const activePlace = flatPlaces.find((place) => place.id === activePlaceId) ?? flatPlaces[0] ?? null;
  const chips = trip?.followUpSuggestions?.length ? trip.followUpSuggestions : DEFAULT_CHIPS;

  useEffect(() => {
    activePlaceIdRef.current = activePlaceId;
  }, [activePlaceId]);

  const updateMapSelection = (place, fly = true) => {
    if (!place || !mapRef.current) return;

    const { map, markerIcon } = mapRef.current;
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      marker.setIcon(markerIcon(id === place.id));
    });

    const marker = markersRef.current[place.id];
    if (!marker) return;

    if (fly) {
      map.flyTo([place.lat, place.lng], 14, { duration: 0.8 });
    }

    marker.openPopup();
  };

  const generateTrip = async (promptText) => {
    const prompt = promptText.trim() || DEFAULT_PROMPT;

    setLoading(true);
    setError("");
    setStatusLine("Generating itinerary pipeline...");

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Generation failed");
      }

      const payload = await response.json();
      const nextTrip = payload.trip;

      setTrip(nextTrip);
      setActivePlaceId(nextTrip.days?.[0]?.items?.[0]?.id ?? "");
      setStatusLine(nextTrip.summary || "Itinerary updated.");
    } catch (nextError) {
      setError(nextError.message || "Something went wrong while generating the itinerary.");
      setStatusLine("Backend request failed.");
    } finally {
      setLoading(false);
    }
  };

  const sendMsg = () => {
    const nextPrompt = inputValue.trim();
    setInputValue("");
    generateTrip(nextPrompt || DEFAULT_PROMPT);
  };

  const quickGenerate = (text) => {
    setInputValue(text);
    generateTrip(text);
  };

  const focusPlace = (place) => {
    setActivePlaceId(place.id);
    updateMapSelection(place, true);
  };

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

  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapRef.current) return;
    const L = window.L;

    const map = L.map(mapDivRef.current, { zoomControl: false }).setView([35.682, 139.7595], 12);
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

    mapRef.current = { map, markerIcon, L };
  }, [leafletReady]);

  useEffect(() => {
    generateTrip(DEFAULT_PROMPT);
  }, []);

  useEffect(() => {
    if (!trip || !mapRef.current || !flatPlaces.length) return;

    const { map, markerIcon, L } = mapRef.current;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }

    flatPlaces.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon(place.id === activePlaceIdRef.current) }).addTo(map);
      marker.bindPopup(buildPopupHtml(place), { maxWidth: 260 });
      marker.on("click", () => {
        setActivePlaceId(place.id);
      });
      marker.on("popupopen", () => {
        setActivePlaceId(place.id);
      });
      markersRef.current[place.id] = marker;
    });

    routeRef.current = L.polyline(
      flatPlaces.map((place) => [place.lat, place.lng]),
      {
        color: "#C1442A",
        weight: 4,
        opacity: 0.82,
        dashArray: "10 10",
      },
    ).addTo(map);

    const bounds = L.latLngBounds(flatPlaces.map((place) => [place.lat, place.lng]));
    map.fitBounds(bounds.pad(0.18));
    window.setTimeout(() => map.invalidateSize(), 100);

    const selected = flatPlaces.find((place) => place.id === activePlaceIdRef.current) ?? flatPlaces[0];
    if (selected && selected.id !== activePlaceIdRef.current) {
      setActivePlaceId(selected.id);
    }

    if (selected) {
      window.setTimeout(() => updateMapSelection(selected, false), 160);
    }
  }, [trip, flatPlaces]);

  useEffect(() => {
    if (!activePlace) return;
    updateMapSelection(activePlace, false);
  }, [activePlace]);

  return (
    <div className="travelos-root">
      <style>{CSS}</style>
      <div className="to-app">
        <div className="to-left">
          <div className="to-scroll">
            <div className="to-eyebrow">Trip plan · Auto-updating</div>
            <h1 className="to-title">{trip?.title || "Building your trip..."}</h1>
            <p className="to-subtitle">
              {trip?.subtitle || "TripLine now generates a full itinerary from the prompt, keeps the same interface, and maps the route automatically."}
            </p>
            <div className="to-status">
              {loading ? <span className="to-loading">Generating itinerary</span> : <strong>{statusLine}</strong>}
              {error ? <div className="to-error">{error}</div> : null}
            </div>

            <div className="to-trip-meta">
              <div className="to-meta-item"><div className="to-label">Destination</div><div className="to-value">{trip?.destination || "Tokyo"}</div></div>
              <div className="to-meta-item"><div className="to-label">Budget</div><div className="to-value">{trip?.budgetLabel || "$1,800 total"}</div></div>
              <div className="to-meta-item"><div className="to-label">Pace</div><div className="to-value">{trip?.paceLabel || "Relaxed"}</div></div>
              <div className="to-meta-item"><div className="to-label">Travelers</div><div className="to-value">{trip?.travelerLabel || "2 adults"}</div></div>
            </div>

            {trip?.days?.map((group) => (
              <div className="to-day-block" key={group.day}>
                <div className="to-day-head">
                  <div className="to-num">{String(group.day).padStart(2, "0")}</div>
                  <div className="to-name">{group.dayName}</div>
                  <div className="to-rule"></div>
                </div>

                {group.items.map((place) => (
                  <div
                    key={place.id}
                    className={`to-place-card${activePlaceId === place.id ? " active" : ""}`}
                    onClick={() => focusPlace(place)}
                  >
                    <div className="to-place-time">{place.time}</div>
                    <div className="to-place-img" style={{ backgroundImage: `url('${place.img}')` }}></div>
                    <div className="to-place-body">
                      <div className="to-place-top">
                        <div className="to-place-name">{place.name}</div>
                        <div className="to-place-tag">{place.tag}</div>
                      </div>
                      <div className="to-place-desc">{place.desc}</div>
                      <div className="to-place-foot">
                        <span className="to-stars">{"★".repeat(place.stars)}{"☆".repeat(5 - place.stars)}</span>
                        <span className="to-rating-num">{place.rating}</span>
                        <div className="to-place-actions">
                          <span className="to-price">{place.price}</span>
                          <a
                            className="to-place-link"
                            href={place.primaryLink.href}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {place.primaryLink.label}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="to-composer">
            <div className="to-chips">
              {chips.map((chip) => (
                <div key={chip} className="to-chip" onClick={() => quickGenerate(chip)}>
                  {chip}
                </div>
              ))}
            </div>
            <div className="to-input-row">
              <input
                type="text"
                placeholder="Ask to adjust the plan, budget, pace, food preferences, or city..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && !loading && sendMsg()}
              />
              <button className="to-send-btn" onClick={sendMsg} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12L20 4L13 20L11 13L4 12Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="to-right">
          <div className="to-map-badge">{activePlace ? `Day ${activePlace.day} · ${activePlace.dayName}` : trip?.badge || "Full itinerary · mapped route"}</div>
          <div className="to-map" ref={mapDivRef}></div>
          {tileError && (
            <div className="to-tile-warning">
              Map tiles failed to load.<br />
              This usually means an ad blocker or network filter is blocking tile.openstreetmap.org.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
