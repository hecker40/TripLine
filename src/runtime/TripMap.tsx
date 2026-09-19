import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Activity } from "../../shared/itinerary";
import type { RunEnvelope } from "../../shared/runtime";
import type { RouteMode } from "../../shared/maps";
import { useDayMap } from "./useDayMap";
import { directionsLink, placeLink } from "../lib/map-links";

const colors = [
  "#386c55",
  "#396ab1",
  "#986127",
  "#8859a4",
  "#bc4f5c",
  "#23838b",
  "#68702e",
];
const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export function TripMap({
  activities,
  selected,
  onSelect,
  envelope,
  date,
  dayNumber,
}: {
  activities: Activity[];
  selected: string;
  onSelect: (id: string) => void;
  envelope: RunEnvelope;
  date: string;
  dayNumber: number;
}) {
  const driving = ["rental_car", "rideshare"].includes(
    envelope.run.preferences.transportation,
  );
  const [mode, setMode] = useState<RouteMode>(driving ? "driving" : "walking");
  const routes = useDayMap(envelope, date, mode);
  const [tilesFailed, setTilesFailed] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const color = colors[(dayNumber - 1) % colors.length];
  const research = envelope.run.research;
  const stops = activities.filter((a) => a.category !== "transportation");
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([35.68, 139.76], 12);
    map.current = m;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.openstreetmap.org/fixthemap">Fix the map</a>',
      maxZoom: 19,
    })
      .on("tileerror", () => setTilesFailed(true))
      .on("load", () => setTilesFailed(false))
      .addTo(m);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    markers.current.clear();
    const points: L.LatLngTuple[] = [];
    activities.forEach((a, index) => {
      if (a.category === "transportation") return;
      const resolved = routes.data?.stops.find((s) => s.id === a.id);
      const p: L.LatLngTuple | null =
        resolved?.coordinates ||
        (a.location.latitude !== null && a.location.longitude !== null
          ? [a.location.latitude, a.location.longitude]
          : null);
      if (!p) return;
      points.push(p);
      const marker = L.marker(p, {
        title: `${a.startTime} ${a.title}`,
        icon: L.divIcon({
          className: "map-marker-host",
          html: `<span class="map-marker" style="background:${color}">${index + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });
      const popup = document.createElement("div");
      popup.textContent = `${a.startTime}–${a.endTime} · ${a.title} · ${a.location.name}`;
      marker.bindTooltip(popup, { direction: "top" });
      marker.on("click", () => callback.current(a.id));
      marker.addTo(layer.current!);
      markers.current.set(a.id, marker);
    });
    routes.data?.legs.forEach((leg) => {
      const path = L.polyline(leg.coordinates, {
        color,
        weight: 4,
        opacity: 0.8,
      });
      const label = document.createElement("span");
      label.textContent = `${mode === "walking" ? "Walk" : "Drive"} · ~${leg.minutes} min · ${leg.distanceKm.toFixed(1)} km`;
      path
        .bindTooltip(label)
        .on("click", () => callback.current(leg.to))
        .addTo(layer.current!);
      points.push(...leg.coordinates);
    });
    if (points.length)
      map.current.fitBounds(L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 15,
      });
    else if (research) {
      map.current.setView([research.latitude, research.longitude], 12);
      L.circleMarker([research.latitude, research.longitude], {
        radius: 9,
        color,
        fillOpacity: 0.15,
      })
        .bindTooltip("City center — venue coordinates unavailable")
        .addTo(layer.current);
    }
  }, [activities, routes.data, research, color, mode]);
  useEffect(() => {
    for (const [id, marker] of markers.current) {
      marker
        .getElement()
        ?.querySelector(".map-marker")
        ?.classList.toggle("active", id === selected);
      marker.setZIndexOffset(id === selected ? 1000 : 0);
      if (id === selected) {
        marker.openTooltip();
        map.current?.panTo(marker.getLatLng(), { animate: false });
      } else marker.closeTooltip();
    }
  }, [selected, routes.data, activities]);
  return (
    <section className="day-map" aria-label={`Map for day ${dayNumber}`}>
      <div className="route-toolbar">
        <button
          className="secondary-button"
          disabled={routes.loading}
          onClick={routes.retry}
        >
          Refresh routes
        </button>
        <strong style={{ color }}>
          Day {dayNumber} · {date}
        </strong>
        <label>
          Route preview
          <select
            aria-label="Route preview mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as RouteMode)}
          >
            <option value="walking">Walking</option>
            <option value="driving">Driving</option>
          </select>
        </label>
      </div>
      <div className="map-frame">
        <div
          ref={host}
          className="trip-map"
          aria-label="Interactive itinerary map"
        />
        <div className="map-caption" role="status">
          {tilesFailed
            ? "Map tiles unavailable. Your itinerary is still available."
            : routes.loading
              ? "Resolving this day’s locations and routes…"
              : routes.data?.legs.length
                ? `${routes.data.legs.length} ${mode} legs · only Day ${dayNumber}`
                : "Locations shown where known · no route available"}
        </div>
      </div>
      <div className="route-stops">
        <p className="muted">
          {envelope.run.preferences.transportation === "public_transit" ||
          envelope.run.preferences.transportation === "mixed"
            ? "This preview is not a train route. Use Transit directions below for schedules and connections."
            : "Route durations are estimates. Scheduled activity times are shown below."}
        </p>
        {routes.error && (
          <p role="alert">
            {routes.error} <button onClick={routes.retry}>Retry routes</button>
          </p>
        )}
        {stops.map((a, index) => {
          const previous = stops[index - 1];
          const leg = routes.data?.legs.find(
            (l) => l.from === previous?.id && l.to === a.id,
          );
          const gap = previous
            ? minutes(a.startTime) - minutes(previous.endTime)
            : 0;
          const resolved = routes.data?.stops.find((s) => s.id === a.id);
          return (
            <div
              className={`route-stop ${selected === a.id ? "selected" : ""}`}
              key={a.id}
            >
              {previous && (
                <div className="route-leg">
                  {leg
                    ? `~${leg.minutes} min ${mode} · ${leg.distanceKm.toFixed(1)} km`
                    : "Travel duration unverified"}
                  {leg && leg.minutes > gap && (
                    <strong className="danger">
                      {" "}
                      · Exceeds the {gap} min scheduled gap
                    </strong>
                  )}
                  <a
                    href={directionsLink(
                      previous,
                      a,
                      envelope.run.preferences.destination,
                      envelope.run.preferences.transportation ===
                        "public_transit" ||
                        envelope.run.preferences.transportation === "mixed"
                        ? "transit"
                        : mode,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {envelope.run.preferences.transportation ===
                      "public_transit" ||
                    envelope.run.preferences.transportation === "mixed"
                      ? "Transit directions ↗"
                      : "Directions ↗"}
                  </a>
                </div>
              )}
              <button
                className="route-stop-select"
                onClick={() => onSelect(a.id)}
              >
                <b>{activities.indexOf(a) + 1}</b>
                <span>
                  <strong>
                    {a.startTime}–{a.endTime} · {a.title}
                  </strong>
                  <small>
                    {a.location.name}
                    {resolved?.matchedName
                      ? ` · Map match: ${resolved.matchedName}`
                      : ""}
                  </small>
                </span>
              </button>
              <a
                className="place-link"
                href={placeLink(a, envelope.run.preferences.destination)}
                target="_blank"
                rel="noreferrer"
              >
                Check location ↗
              </a>
            </div>
          );
        })}
        {routes.data?.warnings.map((warning) => (
          <p className="muted" key={warning}>
            {warning}
          </p>
        ))}
        {routes.data && (
          <small>
            Routing:{" "}
            <a
              href="https://routing.openstreetmap.de/about.html"
              target="_blank"
              rel="noreferrer"
            >
              OSRM / FOSSGIS
            </a>{" "}
            · Location search: Photon / OpenStreetMap
          </small>
        )}
      </div>
    </section>
  );
}
